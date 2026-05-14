import type { Message } from '../llm/types.ts';
import type { ToolCall } from '../tools/types.ts';
import fs from 'fs';
import {LLMClient} from '../llm/client.ts';
import type { TokenUsage } from '../llm/types.ts';
export class Conversation {
  private messages: Message[] = [];
  private systemPrompt: string;
  private logFilePath: string;
  private calculateTokenUsage(): TokenUsage {
    // Placeholder implementation - replace with actual token usage calculation
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  constructor(systemPrompt: string = '', logFilePath: string = '') {
    this.systemPrompt = systemPrompt;
    this.logFilePath = logFilePath;
  }

  //判断messages数组的长度，如果超过20条，则需要压缩
  //测试阶段写改成5条，正式阶段再改回20条
  isTooLong(): boolean {
    return this.messages.length > 5;
  }
  //snip压缩，直接从 messages[] 头部删除最旧的若干轮对话（保留系统消息和最近 N 轮）。
  // 压缩算法有损且粗糙，但零延迟、零成本，是最后的紧急兜底手段。
  // snipCompress(): void {
  //   if (this.messages.length <= 20) {
  //     return;
  //   }
  //   this.messages = this.messages.slice(-10);
  // }
  /***
   * AutoCompact（中成本） ：当上下文剩余 token 低于 13,000 时触发（留出压缩本身所需的空间）。
   * 该算法会调用一个专门的压缩模型（如 gpt-3.5-turbo-16k）来重新总结和压缩对话历史，生成一个更短的系统提示。
   ***/
    async autoCompactCompress(): Promise<void> {
    // 计算当前上下文的 token 使用情况
    const tokenUsage = this.calculateTokenUsage();
      const AUTOCOMPACT_PROMPT = `
      你是一个对话历史压缩助手。将以下对话压缩为结构化摘要。
      必须包含以下章节，不得省略：

      ## 已完成的任务
      （列出本次会话中已经完成的所有操作，要具体）

      ## 关键发现
      （代码结构、重要文件位置、已知问题、重要约束等）

      ## 当前状态
      （此刻正在做什么，进行到哪一步）

      ## 待完成事项
      （还需要做什么，按优先级排列）

      ## 重要决策
      （已经做出的技术决策和原因，避免重复讨论）

      压缩后长度不得超过 20,000 token。
    `;

      this.messages=[
        { role: 'system', content: AUTOCOMPACT_PROMPT },
        ...this.messages
      ]
      const llmClient = new LLMClient();
      const {content}=await llmClient.chat(this.messages);
      console.log("压缩结果：\n",content);
      
      //将压缩结果作为新的系统提示，并清空对话历史（保留系统提示）
      this.systemPrompt = content;
      this.messages=[];
  
    
    }
  addUser(content: string): void {
    this.messages.push({ role: 'user', content });
    //将用户输入追加到日志文件中,jsonl格式,格式为{role: 'user', content: '用户输入'，timestamp: '时间搓'}
    try{
      fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'user', content, timestamp: Date.now() })}\n`);
    }catch(e){
      console.log("user日志添加失败：",e);
    }
    // fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'user', content, timestamp: Date.now() })}\n`);
    // fs.appendFileSync(log_file, `User: ${content}\n`);
  }

  addAssistant(content: string): void {
    this.messages.push({ role: 'assistant', content });
    try{
      fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'assistant', content, timestamp: Date.now() })}\n`);
    }catch(e){
      console.log("assistant日志添加失败：",e);
    }
    //fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'assistant', content, timestamp: Date.now() })}\n`);
  }

  addAssistantWithToolCalls(toolCalls: ToolCall[]): void {
    this.messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls,
    });
    try{
      fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'assistant', tool_calls: toolCalls, timestamp: Date.now() })}\n`);
    }catch(e){
      console.log("assistant工具日志添加失败：",e);
    }
    //fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'assistant', tool_calls: toolCalls, timestamp: Date.now() })}\n`);
  }

  addToolResult(toolCallId: string, result: string): void {
    this.messages.push({
      role: 'tool',
      content: result,
      tool_call_id: toolCallId,
    });
    try{
      fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'tool', content: result, tool_call_id: toolCallId, timestamp: Date.now() })}\n`);
    }catch(e){
      console.log("tool日志添加失败：",e);
    }
    
    //fs.appendFileSync(this.logFilePath, `${JSON.stringify({ role: 'tool', content: result, tool_call_id: toolCallId, timestamp: Date.now() })}\n`);
  }

  getMessages(): Message[] {
    const msgs: Message[] = [];
    if (this.systemPrompt) {
      msgs.push({ role: 'system', content: this.systemPrompt });
    }
    return msgs.concat(this.messages);
  }

  clear(): void {
    this.messages = [];
  }
}