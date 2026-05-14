import type { Message } from '../llm/types.ts';
import type { ToolCall } from '../tools/types.ts';
import fs from 'fs';
export class Conversation {
  private messages: Message[] = [];
  private systemPrompt: string;
  private logFilePath: string;

  constructor(systemPrompt: string = '', logFilePath: string = '') {
    this.systemPrompt = systemPrompt;
    this.logFilePath = logFilePath;
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