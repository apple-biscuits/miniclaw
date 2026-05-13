# 🚀 大模型 Agent 应用开发完全指南

> 从零基础到构建一个功能完整的命令行 Agent 助手

---

## 📖 目录

1. [核心概念理解](#1-核心概念理解)
2. [项目架构解析](#2-项目架构解析)
3. [逐步开发指南](#3-逐步开发指南)
4. [实战演练](#4-实战演练)
5. [进阶技巧](#5-进阶技巧)
6. [常见问题](#6-常见问题)

---

## 1. 核心概念理解

### 1.1 什么是 Agent？

**Agent（智能代理）= 大模型 + 工具 + 自主决策**

想象一下：
- **普通聊天机器人**：只能对话，无法操作
- **Agent**：能对话 + 能执行操作（读写文件、运行命令、搜索信息等）

```
用户："帮我统计 src 目录下有多少个 .ts 文件"
         ↓
Agent 思考：我需要使用 glob 工具搜索文件
         ↓
Agent 执行：调用 glob 工具，参数 "src/**/*.ts"
         ↓
Agent 回答："共有 16 个 TypeScript 文件"
```

### 1.2 关键组件

#### A. **LLM (Large Language Model) - 大脑**
- 负责理解用户意图
- 决定调用哪个工具
- 生成回复

#### B. **Tools (工具) - 手脚**
- `read`: 读取文件
- `write`: 写入文件
- `bash`: 执行命令
- `grep`: 搜索代码
- `glob`: 查找文件

#### C. **Conversation (对话管理) - 记忆**
- 记录对话历史
- 维护上下文
- 管理工具调用记录

#### D. **Agent (代理控制器) - 协调者**
- 协调 LLM 和工具
- 实现工具调用循环
- 处理错误

### 1.3 工作流程

```
┌─────────────┐
│  用户输入    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Agent 将输入发送给 LLM         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  LLM 分析：需要工具吗？         │
└──────┬──────────────────────────┘
       │
       ├─→ 不需要 ─→ 直接回复
       │
       └─→ 需要工具
           │
           ▼
    ┌─────────────────┐
    │  执行工具调用    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  将结果返回 LLM  │
    └────────┬────────┘
             │
             └─→ 循环，直到 LLM 给出最终回复
```

---

## 2. 项目架构解析

### 2.1 目录结构

```
cli/
├── src/
│   ├── index.ts              # 入口文件（启动应用）
│   ├── cli.ts                # 命令行界面（用户交互）
│   │
│   ├── core/                 # 核心逻辑
│   │   ├── agent.ts          # Agent 控制器（最重要！）
│   │   └── conversation.ts   # 对话管理
│   │
│   ├── llm/                  # 大模型接口
│   │   ├── client.ts         # OpenAI API 调用
│   │   └── types.ts          # 类型定义
│   │
│   ├── tools/                # 工具系统
│   │   ├── types.ts          # 工具接口定义
│   │   ├── registry.ts       # 工具注册中心
│   │   └── builtin/          # 内置工具
│   │       ├── read.ts       # 读文件工具
│   │       ├── write.ts      # 写文件工具
│   │       ├── bash.ts       # 命令执行工具
│   │       ├── grep.ts       # 代码搜索工具
│   │       ├── glob.ts       # 文件查找工具
│   │       └── edit.ts       # 文件编辑工具
│   │
│   └── config/
│       └── env.ts            # 配置文件
│
├── package.json
└── tsconfig.json
```

### 2.2 数据流动

```
用户输入 (cli.ts)
    ↓
Agent.run() (core/agent.ts)
    ↓
LLMClient.chatWithTools() (llm/client.ts)
    ↓
OpenAI API
    ↓
Tool Call 决策
    ↓
ToolRegistry.execute() (tools/registry.ts)
    ↓
具体工具执行 (tools/builtin/*.ts)
    ↓
结果返回给 LLM
    ↓
最终回复给用户
```

---

## 3. 逐步开发指南

### 第一阶段：理解基础 (已完成 ✅)

#### 步骤 1：配置环境

**文件：`src/config/env.ts`**

```typescript
export const config = {
  apiKey: 'your-api-key',           // API 密钥
  baseUrl: 'https://api.xxx.com',   // API 地址
  model: 'gpt-4o',                   // 模型名称
};
```

**学习要点：**
- 不同的 API 提供商有不同的 baseUrl
- 选择合适的模型（速度 vs 智能）

---

#### 步骤 2：理解消息格式

**文件：`src/llm/types.ts`**

大模型的对话是一系列消息组成的：

```typescript
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];      // 工具调用
  tool_call_id?: string;         // 工具调用ID
}
```

**消息类型：**
1. **system**: 系统提示词（告诉 AI 它是谁）
2. **user**: 用户输入
3. **assistant**: AI 回复
4. **tool**: 工具执行结果

**对话示例：**
```typescript
[
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: '读取 README.md' },
  { role: 'assistant', content: null, tool_calls: [{...}] },
  { role: 'tool', content: 'README 内容...', tool_call_id: 'xxx' },
  { role: 'assistant', content: '文件内容是...' }
]
```

---

#### 步骤 3：对话管理

**文件：`src/core/conversation.ts`**

```typescript
export class Conversation {
  private messages: Message[] = [];
  
  // 添加用户消息
  addUser(content: string): void {
    this.messages.push({ role: 'user', content });
  }
  
  // 添加 AI 回复
  addAssistant(content: string): void {
    this.messages.push({ role: 'assistant', content });
  }
  
  // 添加工具调用
  addAssistantWithToolCalls(toolCalls: ToolCall[]): void {
    this.messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls
    });
  }
  
  // 添加工具结果
  addToolResult(toolCallId: string, result: string): void {
    this.messages.push({
      role: 'tool',
      content: result,
      tool_call_id: toolCallId
    });
  }
}
```

**学习要点：**
- 对话历史很重要，影响 AI 理解上下文
- 工具调用也要记录到对话中

---

### 第二阶段：工具系统 (核心！)

#### 步骤 4：理解工具定义

**文件：`src/tools/types.ts`**

工具有两部分：
1. **定义 (Definition)**: 告诉 AI 这个工具是什么
2. **执行 (Execute)**: 实际功能实现

```typescript
export interface Tool {
  definition: ToolDefinition;                    // 工具描述
  execute: (args: any) => Promise<string>;       // 执行函数
}

export interface ToolDefinition {
  name: string;                    // 工具名称
  description: string;             // 功能描述（重要！）
  parameters: {                    // 参数定义
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}
```

**关键：description 要清晰！**
- ❌ 差的描述："读取文件"
- ✅ 好的描述："Read the contents of a file at the specified path"

---

#### 步骤 5：实现一个简单工具

**示例：读取文件工具 `src/tools/builtin/read.ts`**

```typescript
import * as fs from 'fs/promises';

export const readTool: Tool = {
  // 1. 定义：告诉 AI 这个工具是什么
  definition: {
    name: 'read',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The path to the file to read'
        }
      },
      required: ['file_path']
    }
  },
  
  // 2. 执行：实际功能
  async execute(args: Record<string, unknown>): Promise<string> {
    const filePath = args.file_path as string;
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;  // 返回文件内容
    } catch (error) {
      return `Error: ${error.message}`;  // 返回错误信息
    }
  }
};
```

**学习要点：**
- 工具必须返回 `string`（AI 只能理解文本）
- 错误也要以文本形式返回
- 参数描述要准确

---

#### 步骤 6：工具注册中心

**文件：`src/tools/registry.ts`**

```typescript
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  // 注册工具
  register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }
  
  // 获取所有工具定义（给 AI 看）
  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values())
      .map(t => t.definition);
  }
  
  // 执行工具
  async execute(name: string, args: any): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(args);
  }
}
```

---

### 第三阶段：Agent 控制器 (最重要！)

#### 步骤 7：Agent 主循环

**文件：`src/core/agent.ts`**

这是整个系统的核心：

```typescript
export class Agent {
  private client: LLMClient;           // AI 客户端
  private conversation: Conversation;   // 对话管理
  private tools: ToolRegistry;         // 工具注册中心
  
  async run(userInput: string): Promise<string> {
    // 1. 添加用户输入到对话
    this.conversation.addUser(userInput);
    
    // 2. 进入工具调用循环
    while (true) {
      // 2.1 调用 LLM，传入对话和工具定义
      const response = await this.client.chatWithTools(
        this.conversation.getMessages(),
        this.tools.getDefinitions()
      );
      
      // 2.2 检查是否有工具调用
      if (response.toolCalls && response.toolCalls.length > 0) {
        // 2.3 记录 AI 的工具调用决策
        this.conversation.addAssistantWithToolCalls(response.toolCalls);
        
        // 2.4 执行每个工具
        for (const toolCall of response.toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await this.tools.execute(
            toolCall.function.name,
            args
          );
          
          // 2.5 记录工具执行结果
          this.conversation.addToolResult(toolCall.id, result);
        }
        
        // 2.6 继续循环，让 AI 看到工具结果
        continue;
      }
      
      // 3. 没有工具调用，返回最终回复
      const content = response.content || '';
      this.conversation.addAssistant(content);
      return content;
    }
  }
}
```

**理解循环的关键：**

```
用户："帮我创建一个 test.txt 文件，内容是 Hello"

第1轮：
→ AI 决策："我需要用 write 工具"
→ 执行 write 工具
→ 继续循环

第2轮：
→ AI 看到工具成功了
→ AI 决策："已完成，回复用户"
→ 返回："已创建 test.txt 文件"
```

---

### 第四阶段：LLM 客户端

#### 步骤 8：调用 OpenAI API

**文件：`src/llm/client.ts`**

```typescript
export class LLMClient {
  private client: OpenAI;
  
  async chatWithTools(
    messages: Message[],
    tools: ToolDefinition[]
  ): Promise<LLMResponse> {
    // 1. 转换工具定义为 OpenAI 格式
    const openaiTools = tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
    
    // 2. 调用 API
    const response = await this.client.chat.completions.create({
      model: config.model,
      messages: messages,
      tools: openaiTools.length > 0 ? openaiTools : undefined
    });
    
    // 3. 提取回复和工具调用
    const message = response.choices[0]?.message;
    
    return {
      content: message?.content || null,
      toolCalls: message?.tool_calls?.map(tc => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }))
    };
  }
}
```

**学习要点：**
- OpenAI 有特定的工具调用格式
- API 返回的可能是文本，也可能是工具调用
- 需要正确解析响应

---

### 第五阶段：命令行界面

#### 步骤 9：用户交互

**文件：`src/cli.ts`**

```typescript
export async function runCLI(): Promise<void> {
  // 1. 创建 Agent
  const agent = new Agent(SYSTEM_PROMPT);
  
  // 2. 注册所有工具
  agent.registerTool(readTool);
  agent.registerTool(writeTool);
  agent.registerTool(bashTool);
  // ... 其他工具
  
  // 3. 创建命令行界面
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('🤖 Mini-Agent v0.1.0');
  console.log('输入 "exit" 退出\n');
  
  // 4. 主循环
  while (true) {
    const input = await question(rl, '您: ');
    
    if (input.toLowerCase() === 'exit') {
      break;
    }
    
    try {
      // 5. 让 Agent 处理
      const response = await agent.run(input);
      console.log(`\n🤖 Agent: ${response}\n`);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  rl.close();
}
```

---

## 4. 实战演练

### 练习 1：测试基本对话

```bash
pnpm start
```

```
您: 你好
🤖 Agent: 你好！有什么可以帮助你的吗？
```

### 练习 2：测试文件读取

```
您: 读取 package.json 文件
🤖 Agent: [Tool: read]
{
  "file_path": "package.json"
}
(文件内容)

好的，这是你的 package.json 文件内容...
```

### 练习 3：测试文件创建

```
您: 帮我创建一个 hello.txt，内容是 "Hello World"
🤖 Agent: [Tool: write]
{
  "file_path": "hello.txt",
  "content": "Hello World"
}
Success

已成功创建 hello.txt 文件！
```

### 练习 4：测试命令执行

```
您: 列出当前目录的文件
🤖 Agent: [Tool: bash]
{
  "command": "ls"
}
(目录列表)

当前目录包含以下文件...
```

---

## 5. 进阶技巧

### 5.1 添加自定义工具

**示例：添加一个天气查询工具**

创建 `src/tools/builtin/weather.ts`:

```typescript
export const weatherTool: Tool = {
  definition: {
    name: 'get_weather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name, e.g., Beijing'
        }
      },
      required: ['city']
    }
  },
  
  async execute(args: Record<string, unknown>): Promise<string> {
    const city = args.city as string;
    
    // 这里调用天气 API
    // const weather = await fetchWeather(city);
    
    // 模拟返回
    return `${city}的天气：晴朗，温度 25°C`;
  }
};
```

然后在 `cli.ts` 中注册：
```typescript
agent.registerTool(weatherTool);
```

### 5.2 改进 System Prompt

System Prompt 非常重要，它定义了 Agent 的行为：

```typescript
const SYSTEM_PROMPT = `你是一个强大的编程助手 Agent，拥有以下能力：

1. 文件操作：read, write, edit
2. 命令执行：bash
3. 代码搜索：grep, glob

使用原则：
- 用户要求读写文件时，优先使用工具而不是描述
- 执行命令时要小心，避免危险操作
- 给出清晰的操作反馈
- 如果不确定，先询问用户

你的目标是帮助用户高效完成编程任务。`;
```

### 5.3 错误处理优化

```typescript
async execute(args: Record<string, unknown>): Promise<string> {
  try {
    // 1. 验证参数
    if (!args.file_path) {
      return 'Error: file_path is required';
    }
    
    // 2. 执行操作
    const result = await fs.readFile(args.file_path as string, 'utf-8');
    
    // 3. 返回结果
    return result;
  } catch (error) {
    // 4. 详细的错误信息
    if (error.code === 'ENOENT') {
      return `Error: File not found: ${args.file_path}`;
    }
    return `Error: ${error.message}`;
  }
}
```

### 5.4 添加流式输出

让 AI 回复像打字一样逐字显示：

```typescript
async *streamChat(messages: Message[]): AsyncGenerator<string> {
  const stream = await this.client.chat.completions.create({
    model: config.model,
    messages: messages,
    stream: true  // 开启流式
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
```

使用：
```typescript
for await (const chunk of client.streamChat(messages)) {
  process.stdout.write(chunk);
}
```

---

## 6. 常见问题

### Q1: AI 不调用工具怎么办？

**可能原因：**
1. 工具描述不清晰
2. System Prompt 没有强调使用工具
3. 用户输入太模糊

**解决方案：**
```typescript
// 改进工具描述
description: 'Read the COMPLETE contents of a file. Use this tool whenever the user asks to see, read, or check file contents.'

// 改进 System Prompt
const SYSTEM_PROMPT = `...
IMPORTANT: Always use tools when the user needs to interact with files or system.
For example:
- User: "show me the code" → Use read tool
- User: "create a file" → Use write tool
...`;
```

### Q2: 工具调用失败如何调试？

```typescript
// 在 agent.ts 中添加日志
console.log('Tool call:', toolCall.function.name);
console.log('Arguments:', toolCall.function.arguments);

try {
  const result = await this.tools.execute(...);
  console.log('Result:', result.substring(0, 100));
} catch (error) {
  console.error('Tool error:', error);
}
```

### Q3: 如何限制工具调用次数？

```typescript
async run(userInput: string): Promise<string> {
  this.conversation.addUser(userInput);
  
  const MAX_ITERATIONS = 10;  // 最多 10 轮
  let iterations = 0;
  
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    const response = await this.client.chatWithTools(...);
    
    if (!response.toolCalls) {
      return response.content || '';
    }
    
    // 执行工具...
  }
  
  return 'Error: Too many tool calls';
}
```

### Q4: 如何支持多个文件操作？

AI 可以连续调用多个工具：

```
用户："读取 a.txt 和 b.txt，然后合并内容写入 c.txt"

第1轮：AI 调用 read(a.txt)
第2轮：AI 调用 read(b.txt)
第3轮：AI 调用 write(c.txt, content=a+b)
第4轮：AI 回复用户
```

只要工具定义清晰，AI 会自动规划步骤。

### Q5: 如何处理大文件？

```typescript
async execute(args: Record<string, unknown>): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // 限制返回大小
  const MAX_SIZE = 10000;
  if (content.length > MAX_SIZE) {
    return content.substring(0, MAX_SIZE) + 
           `\n\n...(truncated, total ${content.length} chars)`;
  }
  
  return content;
}
```

---

## 7. 下一步学习

### 7.1 当前项目改进方向

1. **添加更多工具**
   - 网络请求工具
   - 数据库查询工具
   - 图片处理工具

2. **改进用户体验**
   - 添加彩色输出
   - 添加进度提示
   - 支持多行输入

3. **增强安全性**
   - 危险命令确认
   - 文件路径验证
   - 权限控制

4. **持久化**
   - 保存对话历史
   - 支持会话恢复

### 7.2 学习资源

- **OpenAI 文档**: https://platform.openai.com/docs/guides/function-calling
- **LangChain**: 更强大的 Agent 框架
- **AutoGPT**: 自主 Agent 的典范

### 7.3 实战项目建议

1. **代码审查助手**: 自动检查代码问题
2. **文档生成器**: 自动生成 API 文档
3. **测试用例生成器**: 自动编写测试
4. **数据分析助手**: 分析 CSV/JSON 数据

---

## 8. 总结

### 核心要点回顾

1. **Agent = LLM + Tools + Loop**
   - LLM 负责思考和决策
   - Tools 负责实际操作
   - Loop 负责协调两者

2. **工具定义是关键**
   - 描述要清晰准确
   - 参数要完整
   - 错误处理要友好

3. **对话管理很重要**
   - 完整的上下文
   - 正确的消息格式
   - 工具调用记录

4. **System Prompt 定义行为**
   - 清晰的角色定位
   - 明确的使用规则
   - 具体的示例

### 开发心法

1. **从简单开始**: 先让基本功能跑通
2. **逐步迭代**: 一次添加一个工具
3. **充分测试**: 多试不同的用户输入
4. **查看日志**: 理解 AI 的决策过程
5. **优化提示词**: 不断改进 System Prompt

---

## 9. 快速启动检查清单

- [ ] 安装依赖: `pnpm install`
- [ ] 配置 API: 编辑 `src/config/env.ts`
- [ ] 测试运行: `pnpm start`
- [ ] 测试对话: 输入 "你好"
- [ ] 测试工具: 输入 "读取 package.json"
- [ ] 阅读代码: 从 `agent.ts` 开始
- [ ] 添加工具: 创建自己的工具
- [ ] 改进提示词: 优化 System Prompt

---

**恭喜！🎉**

现在您已经掌握了大模型 Agent 应用开发的核心知识。

记住：最好的学习方式是实践。开始修改代码，添加新功能，看看会发生什么！

有问题随时查阅本文档，祝您开发愉快！
