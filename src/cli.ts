import * as readline from 'readline';
import chalk from 'chalk';
import { Conversation } from './core/conversation.ts';
import { Agent } from './core/agent.ts';
import { cmdTool, editTool, writeTool, globTool, grepTool, readTool, searchTool, createTodoWriteTool } from './tools/builtin/index.ts';
import { TodoManager } from './todo/manager.ts';
import {builtinSubagents} from './subagent/index.ts';
import type {TokenUsage} from './llm/types.ts';
import fs from 'fs';
// const SYSTEM_PROMPT = `You are a helpful assistant.`;
const SYSTEM_PROMPT = `
You are a helpful coding assistant with access to tools.
You can execute bash commands, read/write files, and search code.
IMPORTANT: Use the todo_write tool to track your tasks when working on multi-step tasks.
- Create a todo list at the start of complex tasks
- Update task status as you work (pending -> in_progress -> completed)
- This helps the user see your progress

You can delegate specialized tasks to subagents using the delegate_task tool:
- explorer: For searching and exploring the codebase
- researcher: For reading and understanding code
- planner: For creating implementation plans
`;

function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

export async function runCLI(): Promise<void> {
  //获取当前时间搓
  const timestamp = Date.now();
  //根据时间错在logs文件夹下生成jsonl格式的日志文件，文件名为时间搓
  const logFilePath = `./logs/${timestamp}.jsonl`;
  console.log(chalk.gray(`日志文件路径: ${logFilePath}`));
  //创建文件
  try{
    fs.writeFileSync(logFilePath, '');
  }catch(error){
    console.log("日志文件创建失败，失败原因：",error);
  }
  
  const todoManager = new TodoManager();
  const conversation = new Conversation(SYSTEM_PROMPT,logFilePath);
  const agent = new Agent(conversation);

  // # Register all builtin tools
  // agent.registerTool(bashTool);
  agent.registerTool(cmdTool);
  agent.registerTool(readTool);
  agent.registerTool(writeTool);
  // agent.registerTool(editTool);
  // agent.registerTool(globTool);
  // agent.registerTool(grepTool);
  // agent.registerTool(searchTool);
  // agent.registerTool(createTodoWriteTool(todoManager));


    // Register builtin subagents
  // for (const subagent of builtinSubagents) {
  //   agent.registerSubagent(subagent);
  // }
  // agent.initializeSubagents();
  //从配置中加载MCP服务
  // await agent.loadMCPServers();
  const rl = createReadline();

  console.log(chalk.cyan('你好，我是miniclaw'));
  console.log(chalk.gray('输入 "exit" 退出。\n'));

  // List MCP servers
  // const mcpServers = agent.listMCPServers();
  // if (mcpServers.length > 0) {
  //   // console.log(chalk.gray(`MCP Servers: ${mcpServers.join(', ')}`));
  // }
  

  console.log(chalk.gray(`日志文件路径: ${logFilePath}`));
  while (true) {
    const input = await question(rl, chalk.green('>>> '));
    const trimmed = input.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.toLowerCase() === 'exit') {
      console.log(chalk.gray('Goodbye!'));
      await agent.shutdown();
      break;
    }


    try {
      process.stdout.write(chalk.green('\nAssistant: '));

      let fullResponse = '';
      let isProcessingTool = false;
      let finalUsage: TokenUsage | undefined = undefined;
      
      for await (const chunk of agent.runStream(trimmed)) {
        if (typeof chunk === 'string') {
          // Regular content chunk - output immediately for streaming effect
          process.stdout.write(chunk);
          fullResponse += chunk;
        } else if ('toolCall' in chunk) {
          // A tool call was made - we need to indicate this to the user
          if (!isProcessingTool) {
            isProcessingTool = true;
            process.stdout.write('\n' + chalk.yellow('[正在处理工具调用...]'));
          }
        } else if ('usage' in chunk) {
          // Token usage information
          finalUsage = chunk.usage;
        }
      }

      // Display token usage at the end
      if (finalUsage) {
        console.log(chalk.blue(`\n[Token Usage - Input: ${finalUsage.promptTokens}, Output: ${finalUsage.completionTokens}, Total: ${finalUsage.totalTokens}]`));
      }
      
      console.log('\n');
    } catch (error) {
      console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
      console.log();
    }
  }

  rl.close();
}