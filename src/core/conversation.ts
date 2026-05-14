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
    return this.messages.length > 10;
  }
  //snip压缩，直接从 messages[] 头部删除最旧的若干轮对话（保留系统消息和最近 N 轮）。
  // 压缩算法有损且粗糙，但零延迟、零成本，是最后的紧急兜底手段。
  // snipCompress(): void {
  //   if (this.messages.length <= 20) {
  //     return;
  //   }
  //   this.messages = this.messages.slice(-10);
  // }
  
    async autoCompactCompress(): Promise<void> {
    // 计算当前上下文的 token 使用情况
    // const tokenUsage = this.calculateTokenUsage();
      // 1. 将历史消息格式化为纯文本，以便 LLM 理解
      // 我们需要保留 Role, Content, 以及 Tool Calls 的关键信息
      let historyText = "";
      for (const msg of this.messages) {
        if (msg.role === 'system') continue; // 跳过原有的 system prompt，我们稍后单独处理

        historyText += `\n[${msg.role.toUpperCase()}]: `;

        if (msg.content) {
          historyText += msg.content;
        }

        if (msg.tool_calls && msg.tool_calls.length > 0) {
          historyText += "\n[TOOL CALLS]: ";
          for (const tc of msg.tool_calls) {
            try {
              // 尝试解析参数，使其更易读，或者直接保留 JSON
              const args = typeof tc.function.arguments === 'string'
                ? tc.function.arguments
                : JSON.stringify(tc.function.arguments);
              historyText += `\n- Function: ${tc.function.name}, Args: ${args}`;
            } catch (e) {
              historyText += `\n- Function: ${tc.function.name}, Args: (Error parsing)`;
            }
          }
        }

        if (msg.tool_call_id) {
          historyText += `\n[TOOL RESULT ID: ${msg.tool_call_id}]: ${msg.content}`;
        }
        historyText += "\n---";
      }
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
      ---
      对话历史如下:
      ${historyText}
    `;

      try {
        // 3. 调用 LLM 进行压缩
        // 注意：这里我们只发送一条 User 消息，包含 Prompt 和历史文本
        // 这样可以避免角色混淆
        const llmClient = new LLMClient();
        const response = await llmClient.chat([
          { role: 'user', content: AUTOCOMPACT_PROMPT }
        ]);

        const summary = response.content;
        console.log("[Conversation] 压缩完成\n", summary);

        // 4. 更新 Conversation 状态
        // 策略：清空旧消息，将摘要作为新的 System Prompt 或第一条 User 消息
        // 推荐：作为 System Prompt 的一部分，或者保留最近 1-2 条消息以防上下文断裂

        this.systemPrompt = `${this.systemPrompt}\n\n[History Summary]:\n${summary}`;

        // 可选：保留最后一条用户消息，以便 AI 知道当前紧接着要回答什么
        // 如果 messages 为空，则完全清空
        if (this.messages.length > 0) {
          const lastUserMsg = this.messages[this.messages.length - 1];
          if (lastUserMsg.role === 'user') {
            this.messages = [lastUserMsg];
          } else {
            this.messages = [];
          }
        } else {
          this.messages = [];
        }

      } catch (error) {
        console.error("[Conversation] 压缩失败:", error);
        // 失败时不要清空消息，避免数据丢失
      }
  
    
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