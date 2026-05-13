
import OpenAI from 'openai';
import { config } from '../config/env.ts';
import type { Message, LLMResponse, ToolCall, TokenUsage, LLMResponseWithUsage } from './types.ts';
import type { ToolDefinition } from '../tools/types.ts';

export class LLMClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async chat(messages: Message[]): Promise<{ content: string; usage: TokenUsage }> {
    const response = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
    });

    const usage = response.usage;
    const tokenUsage: TokenUsage = {
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0
    };

    return {
      content: response.choices[0]?.message?.content || '',
      usage: tokenUsage
    };
  }
  
  async chatWithTools(
    messages: Message[],
    tools: ToolDefinition[]
  ): Promise<LLMResponseWithUsage> {
    const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      tools: openaiTools.length > 0 ? openaiTools : undefined,
    });

    const usage = response.usage;
    const tokenUsage: TokenUsage = {
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0
    };

    const choice = response.choices[0];
    const message = choice?.message;

    const toolCalls: ToolCall[] | undefined = message?.tool_calls?.map((tc) => {
      const toolCall = tc as { id: string; type: string; function: { name: string; arguments: string } };
      return {
        id: toolCall.id,
        type: 'function' as const,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      };
    });

    return {
      content: message?.content || null,
      toolCalls,
      usage: tokenUsage
    };
  }
  
  async *streamChat(messages: Message[]): AsyncGenerator<{content?: string; usage?: TokenUsage}> {
    const stream = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      stream: true,
      stream_options: { include_usage: true }, // 开启 usage 统计
    });

    let finalUsage: TokenUsage | undefined = undefined;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { content };
      }

      // 检查最后一个 chunk 是否包含 usage 信息
      if (chunk.usage) {
        finalUsage = {
          promptTokens: chunk.usage.prompt_tokens ?? 0,
          completionTokens: chunk.usage.completion_tokens ?? 0,
          totalTokens: chunk.usage.total_tokens ?? 0
        };
      }
    }

    // 最后返回 usage 信息
    if (finalUsage) {
      yield { usage: finalUsage };
    }
  }
  
  async *streamChatWithTools(
    messages: Message[],
    tools: ToolDefinition[]
  ): AsyncGenerator<{ content?: string; toolCall?: ToolCall; usage?: TokenUsage }> {
    const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const stream = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      stream: true,
      stream_options: { include_usage: true }, // 开启 usage 统计
    });

    let fullToolCalls: Record<string, any>[] = [];
    let finalUsage: TokenUsage | undefined = undefined;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      // Yield content if present
      if (choice.delta?.content) {
        yield { content: choice.delta.content };
      }

      // Handle tool calls
      if (choice.delta?.tool_calls && choice.delta.tool_calls.length > 0) {
        for (const toolCallDelta of choice.delta?.tool_calls) {
          const idx = toolCallDelta.index;

          // Make sure we have an array large enough to accommodate this index
          while (fullToolCalls.length <= idx) {
            fullToolCalls.push({});
          }

          const current = fullToolCalls[idx];

          if (toolCallDelta.id) {
            current.id = toolCallDelta.id;
          }

          if (toolCallDelta.function?.name) {
            if (!current.function) current.function = {};
            current.function.name = toolCallDelta.function.name;
          }

          if (toolCallDelta.function?.arguments) {
            if (!current.function) current.function = {};
            current.function.arguments = (current.function.arguments || '') + toolCallDelta.function.arguments;
          }

          if (toolCallDelta.type) {
            current.type = toolCallDelta.type;
          }

          // Yield individual tool call parts as they come in
          if (current.id && current.type && current.function?.name) {
            yield {
              toolCall: {
                id: current.id,
                type: current.type as 'function',
                function: {
                  name: current.function.name,
                  arguments: current.function.arguments || '',
                },
              }
            };
          }
        }
      }

      // 检查最后一个 chunk 是否包含 usage 信息
      if (chunk.usage) {
        finalUsage = {
          promptTokens: chunk.usage.prompt_tokens ?? 0,
          completionTokens: chunk.usage.completion_tokens ?? 0,
          totalTokens: chunk.usage.total_tokens ?? 0
        };
      }
    }

    // 最后返回 usage 信息
    if (finalUsage) {
      yield { usage: finalUsage };
    }
  }
}