import chalk from 'chalk';
import { LLMClient } from '../llm/client.ts';
import { Conversation } from './conversation.ts';
import { ToolRegistry } from '../tools/registry.ts'
import type { Tool, ToolCall } from '../tools/types.ts';
import type { Message,TokenUsage } from '../llm/types.ts';
import { MCPServerManager } from '../mcp/server.ts';
import { loadMCPConfig } from '../config/env.ts';
import type { MCPServerConfig } from '../mcp/types.ts';
import { SubagentManager ,createSubagentTool} from '../subagent/index.ts';
import type { SubagentConfig } from '../subagent/types.ts';
import { SkillManager, createSkillTools } from '../skills/index.ts';

export class Agent {
  private client: LLMClient;
  private conversation: Conversation;
  private tools: ToolRegistry;
  private mcpManager: MCPServerManager;
  private subagentManager: SubagentManager;
  private skillManager: SkillManager;

  constructor(conversation: Conversation) {
    this.client = new LLMClient();
    this.conversation = conversation;
    this.tools = new ToolRegistry();
    this.mcpManager = new MCPServerManager();
    this.subagentManager = new SubagentManager();
    this.skillManager = new SkillManager();
  }

  registerTool(tool: Tool): void {
    this.tools.register(tool);
  }
   registerSubagent(config: SubagentConfig): void {
    this.subagentManager.registerSubagent(config);
  }

  initializeSubagents(): void {
    // Pass available tools to subagent manager
    this.subagentManager.setAvailableTools(this.tools.getToolsMap());
    // Register the delegate_task tool
    const delegateTool = createSubagentTool(this.subagentManager);
    this.tools.register(delegateTool);
  }

  listSubagents(): string[] {
    return this.subagentManager.getSubagentNames();
  }

  async run(userInput: string): Promise<string> {
    this.conversation.addUser(userInput);

    while (true) {
      const response = await this.client.chatWithTools(
        this.conversation.getMessages(),
        this.tools.getDefinitions()
      );

      // If there are tool calls, execute them
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Add assistant message with tool calls
        this.conversation.addAssistantWithToolCalls(response.toolCalls);

        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          console.log(chalk.yellow(`\n[Tool: ${toolCall.function.name}]`));

          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(chalk.gray(JSON.stringify(args, null, 2)));

            const result = await this.tools.execute(toolCall.function.name, args);

            // Show truncated result
            const displayResult = result.length > 500
              ? result.substring(0, 500) + '...(truncated)'
              : result;
            console.log(chalk.gray(displayResult));

            // Add tool result to conversation
            this.conversation.addToolResult(toolCall.id, result);
          } catch (error) {
            const errorMsg = `Error: ${(error as Error).message}`;
            console.log(chalk.red(errorMsg));
            this.conversation.addToolResult(toolCall.id, errorMsg);
          }
        }

        // Continue the loop to get the next response
        continue;
      }

      // No tool calls, we have a final response
      const content = response.content || '';
      this.conversation.addAssistant(content);
      
      // Log token usage
      console.log(chalk.blue(`\n[Token Usage - Input: ${response.usage.promptTokens}, Output: ${response.usage.completionTokens}, Total: ${response.usage.totalTokens}]`));
      
      return content;
    }
  }

  // New streaming method
  async *runStream(userInput: string): AsyncGenerator<string | { toolCall: ToolCall } | { usage: TokenUsage }> {
    //先判断上下文窗口是否过长，如果过长则进行压缩
    if (this.conversation.isTooLong()) {
      console.log(chalk.yellow('[Context window is too long, compressing...]'));
      await this.conversation.autoCompactCompress();
      console.log(chalk.yellow('[Context window compressed]\n'));
      

    }
    this.conversation.addUser(userInput);

    while (true) {
      // const response = await this.client.chatWithTools(
      //   this.conversation.getMessages(),
      //   this.tools.getDefinitions()
      // );

      // // If there are tool calls, execute them
      // if (response.toolCalls && response.toolCalls.length > 0) {
      //   // Add assistant message with tool calls
      //   this.conversation.addAssistantWithToolCalls(response.toolCalls);

      //   // Execute each tool call and yield the result
      //   for (const toolCall of response.toolCalls) {
      //     console.log(chalk.yellow(`\n[Tool: ${toolCall.function.name}]`));

      //     try {
      //       const args = JSON.parse(toolCall.function.arguments);
      //       console.log(chalk.gray(JSON.stringify(args, null, 2)));

      //       const result = await this.tools.execute(toolCall.function.name, args);

      //       // Show truncated result
      //       const displayResult = result.length > 500
      //         ? result.substring(0, 500) + '...(truncated)'
      //         : result;
      //       console.log(chalk.gray(displayResult));

      //       // Add tool result to conversation
      //       this.conversation.addToolResult(toolCall.id, result);
            
      //       // Yield tool call information
      //       yield { toolCall };
      //     } catch (error) {
      //       const errorMsg = `Error: ${(error as Error).message}`;
      //       console.log(chalk.red(errorMsg));
      //       this.conversation.addToolResult(toolCall.id, errorMsg);
      //     }
      //   }

      //   // Continue the loop to get the next response
      //   continue;
      // }

      // // No tool calls, we can stream the content
      // if (response.content) {
      //   // Add to conversation history
      //   this.conversation.addAssistant(response.content);
        
      //   // Stream the content using the new streamChat method
      //   for await (const chunk of this.client.streamChat(this.conversation.getMessages())) {
      //     if (chunk.content) {
      //       yield chunk.content;
      //     } else if (chunk.usage) {
      //       yield { usage: chunk.usage };
      //     }
      //   }
      // }

      // // End of stream
      // return;
    let fullContent = '';
    let toolCalls:any=[];
    for await (const chunk of this.client.streamChatWithTools(this.conversation.getMessages(), this.tools.getDefinitions())) {
      if (chunk.content) {
        fullContent += chunk.content;
        yield chunk.content;
      }
      if (chunk.toolCall) {
        toolCalls = toolCalls.concat([chunk.toolCall]);
      }
      if (chunk.usage) {
        yield { usage: chunk.usage };
      }
    }
    if(toolCalls.length>0){
      this.conversation.addAssistantWithToolCalls(toolCalls);
      //执行工具调用
      for (const toolCall of toolCalls) {
        const tool = this.tools.get(toolCall.function.name);
        if (tool) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await tool.execute(args);
          this.conversation.addToolResult(toolCall.id, result);
        }
      }
    }
      // 无工具调用，保存内容
      this.conversation.addAssistant(fullContent);
      return;
  }
  }

  async addMCPServer(config: MCPServerConfig): Promise<void> {
    await this.mcpManager.addServer(config);
    // Register MCP tools
    const mcpTools = await this.mcpManager.getAllTools();
    for (const tool of mcpTools) {
      if (!this.tools.has(tool.definition.name)) {
        this.tools.register(tool);
      }
    }
    console.log(chalk.green(`MCP server connected: ${config.name}`));
  }

  async removeMCPServer(name: string): Promise<void> {
    await this.mcpManager.removeServer(name);
  }

  listMCPServers(): string[] {
    return this.mcpManager.listServers();
  }

  async loadMCPServers(): Promise<void> {
    const configs = loadMCPConfig();
    for (const config of configs) {
      try {
        await this.addMCPServer(config);
      } catch (error) {
        console.error(chalk.red(`Failed to connect MCP server ${config.name}:`), error);
      }
    }
  }

  /**
   * 初始化 skills 系统
   */
  async initializeSkills(): Promise<void> {
    await this.skillManager.initialize();
    
    // 注册 skill 管理工具
    const skillTools = createSkillTools(this.skillManager);
    for (const tool of skillTools) {
      this.tools.register(tool);
    }
    
    // 加载已保存的 skills
    await this.skillManager.loadAllSkills();
    
    // 将 loaded skills 的内容注入到 system prompt 中
    await this.injectSkillsToSystemPrompt();
    
    console.log(chalk.green(`Skills system initialized. Loaded ${this.skillManager.getSkillNames().length} skills.`));
  }

  /**
   * 将 skills 的内容注入到 system prompt 中
   * 这是 Anthropic Skills 的标准使用方式 - 作为指令而非工具
   */
  private async injectSkillsToSystemPrompt(): Promise<void> {
    const skills = this.skillManager.getSkills();
    if (skills.length === 0) {
      return;
    }

    const conversation = this.conversation;
    const currentSystemPrompt = (conversation as any).systemPrompt || '';
    
    let skillsSection = '\n\n## Available Skills\n\n';
    skillsSection += 'You have access to the following specialized skills. ';
    skillsSection += 'These skills provide detailed instructions and best practices for specific tasks.\n\n';

    for (const skill of skills) {
      skillsSection += `### ${skill.metadata.name}\n`;
      skillsSection += `**Description**: ${skill.metadata.description}\n`;
      
      if (skill.metadata.tags && skill.metadata.tags.length > 0) {
        skillsSection += `**Tags**: ${skill.metadata.tags.join(', ')}\n`;
      }
      
      // 添加 SKILL.md 的主要内容（限制长度以避免上下文过长）
      const contentPreview = skill.content.substring(0, 2000);
      skillsSection += `\n${contentPreview}\n`;
      
      // 如果有子目录，告知 AI 可以访问这些资源
      const resources = [];
      if (skill.hasScripts) resources.push('scripts/');
      if (skill.hasReferences) resources.push('references/');
      if (skill.hasAssets) resources.push('assets/');
      
      if (resources.length > 0) {
        skillsSection += `\n**Available Resources**: ${resources.join(', ')}\n`;
        skillsSection += `You can read files from these directories using the read tool when needed.\n`;
      }
      
      skillsSection += '\n---\n\n';
    }

    // 更新 system prompt
    (conversation as any).systemPrompt = currentSystemPrompt + skillsSection;
  }

  /**
   * 获取 SkillManager 实例
   */
  getSkillManager(): SkillManager {
    return this.skillManager;
  }

  /**
   * 列出所有已注册的 skills
   */
  listSkills(): string[] {
    return this.skillManager.getSkillNames();
  }

  getConversation(): Conversation {
    return this.conversation;
  }
  async shutdown(): Promise<void> {
    await this.mcpManager.disconnectAll();
  }
}