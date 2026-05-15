这是一个为您的项目 `miniclaw` 编写的 README 文档草案。它基于我们之前讨论的功能（流式输出、工具调用、上下文压缩、日志记录等）进行了整理。您可以根据实际项目的具体细节（如安装步骤、依赖项）进行微调。

---

# Miniclaw 🐾

**Miniclaw** 是一个基于 TypeScript 构建的智能编码助手 CLI 工具。它集成了大语言模型（LLM）、工具调用（Tool Use）和流式输出能力，旨在帮助开发者高效地探索代码库、执行命令、读写文件以及管理复杂任务。

## ✨ 主要特性

- **🚀 流式响应 (Streaming)**：实时显示 AI 的思考过程和生成内容，提供类似打字机的流畅交互体验。
- **🛠️ 强大的工具系统**：内置多种实用工具，支持 AI 自主执行操作：
  - `read` / `write`：读取和写入文件。
  - `cmd` / `powershell`：执行系统命令。
  - `glob` / `grep` / `search`：搜索文件和代码内容。
  - `todo_write`：管理多步任务进度。
- **🎯 Skills 系统（Anthropic 标准格式）**

可复用的技能包管理系统，遵循 **Anthropic Agent Skills 标准**：
- 每个 skill 是一个独立的文件夹
- 核心是 `SKILL.md` 文件（YAML frontmatter + Markdown 指令）
- 支持 scripts、references、assets 子目录
- 渐进式披露机制，高效利用上下文窗口
- 详见 [SKILLS_QUICKSTART.md](./SKILLS_QUICKSTART.md)

**示例 skills：**
- `file-operations/` - 文件操作工具集
- `git-helper/` - Git 操作助手  
- `code-analyzer/` - 代码质量分析器（含脚本和参考文档）

- **🧠 智能上下文管理**：
  - **自动压缩**：当对话历史过长时，自动使用 LLM 对历史进行结构化摘要，保留关键信息并释放上下文窗口。
  - **Token 统计**：在每次对话结束后显示详细的 Input/Output Token 使用情况。
- **📝 会话日志 (JSONL)**：自动将每轮对话（包括用户输入、AI 回复、工具调用及结果）保存为 JSONL 格式日志，便于调试和回溯。
- **🤖 Agent 架构**：采用模块化设计，支持扩展自定义工具和子代理（Subagents）。

## 📦 安装与运行

### 前置要求

- Node.js >= 18.0.0
- npm 或 yarn
- OpenAI API Key (或其他兼容 OpenAI 格式的 LLM 提供商 Key)

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <your-repo-url>
   cd miniclaw
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   在项目根目录创建 `.env` 文件，并填入您的 API Key：
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   # 如果使用其他兼容端点，可能还需要配置 BASE_URL
   # OPENAI_BASE_URL=https://api.your-provider.com/v1
   ```

4. **启动 CLI**
   ```bash
   npm run start
   # 或者
   ts-node src/cli.ts
   ```

## 🚀 使用指南

启动后，您将进入交互界面：

```
你好，我是miniclaw
输入 "exit" 退出。

>>> 帮我查看当前目录下有哪些子文件夹
```

### 常用指令

- **自然语言对话**：直接询问代码问题或请求生成代码。
- **任务委托**：对于复杂任务，AI 会自动使用 `todo_write` 工具规划步骤。
- **文件操作**：您可以要求 AI “读取 src/main.ts 并解释其功能” 或 “创建一个 index.html 文件”。
- **退出**：输入 `exit` 结束会话。

### 日志查看

每次会话会在 `logs/` 目录下生成一个以时间戳命名的 [.jsonl](file://e:\miniclaw\logs\1778737829263.jsonl) 文件。您可以使用以下命令查看最近一次的日志：

```bash
tail -f logs/*.jsonl
```

## 🏗️ 项目结构

```
miniclaw/
├── src/
│   ├── cli.ts            # CLI 入口与交互逻辑
│   ├── core/
│   │   ├── agent.ts      # Agent 核心逻辑（流式处理、工具调度）
│   │   └── conversation.ts # 对话历史管理与上下文压缩
│   ├── llm/
│   │   ├── client.ts     # LLM 客户端封装（OpenAI 兼容）
│   │   └── types.ts      # 类型定义
│   ├── tools/
│   │   └── builtin/      # 内置工具实现 (read, write, cmd, etc.)
│   ├── skills/           # Skills 技能系统
│   │   ├── types.ts      # Skill 类型定义
│   │   ├── manager.ts    # Skill 管理器
│   │   └── index.ts      # 导出和工具函数
│   ├── subagent/         # 子代理模块 (可选)
│   └── utils/            # 工具函数 (Token 估算等)
├── skills/               # Skill 存储目录
├── logs/                 # 会话日志存储目录
├── examples/             # 示例代码
├── package.json
└── tsconfig.json
```

## ⚙️ 核心模块说明

### 1. Conversation & Context Compression
[Conversation](src/core/conversation.ts) 类负责管理对话历史。
- **自动压缩**：当消息数量超过阈值（默认 10 条，可配置）时，触发 [autoCompactCompress](file://e:\miniclaw\src\core\conversation.ts#L33-L130)。
- **压缩策略**：将历史对话转换为结构化文本，发送给 LLM 生成摘要，并将摘要存入 System Prompt，从而在保留“记忆”的同时重置上下文长度。

### 2. Streaming & Token Usage
[LLMClient](src/llm/client.ts) 支持 `stream_options: { include_usage: true }`。
- **流式输出**：通过 `AsyncGenerator` 逐块返回内容。
- **Token 统计**：在流结束时捕获 [usage](file://e:\miniclaw\src\llm\types.ts#L30-L30) 对象，并在 CLI 界面底部显示 `[Token Usage - Input: XX, Output: YY, Total: ZZ]`。

### 3. Tool Execution
Agent 能够解析 LLM 返回的工具调用请求，执行本地操作，并将结果反馈给 LLM。
- **错误处理**：如果工具执行失败（如 JSON 解析错误），会将错误信息作为 `tool` 角色消息返回给 LLM，使其有机会自我修正。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE)。

---

**Happy Coding with Miniclaw! 🐱‍💻**