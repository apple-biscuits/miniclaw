# Skills 功能使用指南

## 概述

Skills 是一个可复用的技能包系统，遵循 **Anthropic Agent Skills 标准格式**。每个 skill 是一个独立的文件夹，包含指令、脚本和资源文件，让 AI 能够动态加载并提升在特定任务上的表现。

## 核心概念

- **Skill**: 一个自包含的文件夹，核心是 `SKILL.md` 文件
- **渐进式披露**: Claude 先读取 YAML frontmatter 判断是否相关，再按需加载详细内容
- **三层结构**: 
  - Layer 1: YAML frontmatter（始终加载，用于路由匹配）
  - Layer 2: SKILL.md 正文（条件加载，提供详细指令）
  - Layer 3: scripts/references/assets（按需加载，提供资源和支持）

## Skill 文件夹结构

```
your-skill-name/
├── SKILL.md              # 必需 - 主技能文件（YAML frontmatter + Markdown 内容）
├── scripts/              # 可选 - 可执行脚本（Python, JavaScript, Bash 等）
├── references/           # 可选 - 参考文档、API 文档、示例代码
└── assets/               # 可选 - 模板文件、图标、字体等资源
```

### SKILL.md 文件格式

```
---
name: skill-name
description: 简短描述，说明何时使用此技能
version: 1.0.0
author: Your Name
tags: ["tag1", "tag2"]
---

# Skill 标题

详细的指令、示例和约束规则...

## 何时使用

说明在什么场景下应该使用此技能...

## 使用方法

具体的使用步骤和示例...

## 最佳实践

建议和注意事项...
```

## 内置 Skill 管理工具

系统提供了以下内置工具来管理 skills：

### 1. create_skill - 创建新 skill 文件夹

创建一个新的 skill 文件夹结构，包括 SKILL.md 和子目录。

**参数：**
- `name` (必需): skill 名称
- `description` (必需): skill 描述和触发场景
- `content` (必需): SKILL.md 的 Markdown 正文内容
- `author` (可选): 作者
- `tags` (可选): 标签数组

**示例：**
```
create_skill(
  name="data-analysis",
  description="Analyze data files and generate insights. Use when user needs to process CSV, JSON, or Excel files.",
  author="Data Team",
  tags=["data", "analysis", "csv"],
  content="# Data Analysis Skill\n\nThis skill provides..."
)
```

**创建的文件夹结构：**
```
skills/data-analysis/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

### 2. load_skill - 从文件夹加载 skill

从文件夹加载一个 skill（必须包含 SKILL.md）。

**参数：**
- `folder_path` (必需): skill 文件夹路径

**示例：**
```
load_skill(folder_path="./skills/my-custom-skill")
```

### 3. list_skills - 列出所有已注册的 skills

显示当前系统中所有已注册的 skills 及其特性。

**参数：** 无

**输出示例：**
```
Registered skills:
- file-operations v1.0.0: Advanced file operations including backup, copy, and move [scripts, references]
- git-helper v1.0.0: Git operations helper for checking status and viewing history
- code-analyzer v1.0.0: Analyze code quality and complexity [scripts, references, assets]
```

### 4. get_skill_info - 获取 skill 详细信息

获取特定 skill 的完整信息，包括其文件和目录结构。

**参数：**
- `skill_name` (必需): skill 名称

**示例：**
```
get_skill_info(skill_name="code-analyzer")
```

**输出示例：**
```
Skill: code-analyzer
Version: 1.0.0
Description: Analyze code quality, complexity, and structure
Path: ./skills/code-analyzer

Scripts:
  - calculate-complexity.js
  - check-naming.js

References:
  - coding-standards.md
  - complexity-metrics.md

Assets:
  - report-template.md

SKILL.md Preview (first 500 chars):
# Code Analyzer Skill

This skill provides comprehensive code analysis...
```

### 5. remove_skill - 移除 skill

从注册表中移除一个 skill（不删除文件夹）。

**参数：**
- `skill_name` (必需): 要移除的 skill 名称

**示例：**
```
remove_skill(skill_name="old-skill")
```

## 使用流程

### 1. 创建 Skill

使用 `create_skill` 工具创建一个新的 skill 文件夹：

```javascript
create_skill(
  name="api-tester",
  description="Test REST APIs with various HTTP methods. Use when user needs to test API endpoints.",
  author="QA Team",
  tags=["api", "testing", "http"],
  content=`# API Tester Skill

## When to Use
Use this skill when testing REST APIs...

## Available Methods
- GET: Retrieve data
- POST: Create resources
- PUT: Update resources
- DELETE: Remove resources

## Example Usage
\`\`\`
test_api(method="GET", url="https://api.example.com/users")
\`\`\`
`
)
```

### 2. 添加脚本和资源

创建 skill 后，可以向子目录添加文件：

```bash
# 添加参考文档
echo "# API Best Practices" > skills/api-tester/references/best-practices.md

# 添加测试脚本
cat > skills/api-tester/scripts/test-endpoint.js << 'EOF'
// API testing script
const fetch = require('node-fetch');
async function testEndpoint(url, method) {
  const response = await fetch(url, { method });
  return response.json();
}
module.exports = { testEndpoint };
EOF
```

### 3. 加载 Skill

系统启动时会自动加载 `skills/` 目录下的所有 skill 文件夹。你也可以手动加载：

```
load_skill(folder_path="./path/to/custom-skill")
```

### 4. 使用 Skill

一旦 skill 被加载，AI 会根据用户请求自动判断是否使用该 skill。Skill 中的指令会指导 AI 如何执行任务。

**用户**: "帮我检查一下这个 Git 仓库的状态"

**AI**: （自动识别并使用 git-helper skill）
```
我将使用 git-helper skill 来检查仓库状态...
git_status(repo_path=".")
```

## 设计原则

### 1. 渐进式披露（Progressive Disclosure）

不要一次性把所有信息都给 AI，而是分层提供：

- **Layer 1 (Frontmatter)**: 简洁的描述，让 AI 快速判断相关性
- **Layer 2 (SKILL.md)**: 详细的使用指令和示例
- **Layer 3 (Subdirectories)**: 按需加载的资源和脚本

### 2. Description 是触发器

`description` 字段不是给人看的摘要，而是告诉 AI **"在什么情况下触发我"**。

**好的 description:**
```yaml
description: Analyze code quality and identify complexity issues. Use when user wants to review code or find potential problems.
```

**差的 description:**
```yaml
description: A tool for code analysis
```

### 3. 给 AI 自由度

提供足够的信息和示例，但不要过度指令化。让 AI 根据具体上下文灵活应用。

### 4. 文件系统即上下文工程

把 skill 当作一个工作空间，而不是单一的指令文件：
- `references/`: 放详细的 API 文档、函数签名、示例
- `assets/`: 放模板文件，AI 可以直接复制使用
- `scripts/`: 放可执行脚本，AI 可以调用

## 示例 Skills

### file-operations
提供高级文件操作能力：
- 备份文件
- 复制文件
- 移动/重命名文件

### git-helper
Git 操作助手：
- 检查仓库状态
- 查看提交历史
- 比较差异

### code-analyzer
代码质量分析：
- 复杂度计算
- 代码风格检查
- 结构分析
- 包含 scripts 和 references 目录

## 最佳实践

1. **命名规范**: 使用 kebab-case（短横线分隔小写字母），如 `api-tester`
2. **文件名**: 必须是 `SKILL.md`（区分大小写，全大写）
3. **避免冲突**: 不要使用 `claude` 或 `anthropic` 作为 skill 名称开头
4. **清晰的 description**: 明确说明何时使用此 skill
5. **结构化内容**: 使用 Markdown 标题组织内容
6. **提供示例**: 包含具体的使用示例
7. **版本管理**: 维护 version 字段
8. **标签分类**: 使用 tags 便于搜索和过滤

## 高级用法

### 动态配置

有些 skill 需要用户在首次使用时提供配置。可以在 SKILL.md 中说明：

```
## Configuration

On first use, create a `config.json` file in the skill directory:

```json
{
  "api_key": "your-api-key",
  "base_url": "https://api.example.com"
}
```

If config.json doesn't exist, guide the user to create it.
```

### 记忆功能

Skill 可以使用文件存储历史状态：

```
## Memory

This skill maintains a history log in `memory/history.json`.
Each usage appends to this file, allowing the skill to reference past interactions.
```

### 链式调用

多个 skills 可以协同工作：

```
User: "Create a PowerPoint presentation about our Q4 results"

AI uses:
1. data-analyzer skill → Process Q4 data
2. brand-guidelines skill → Apply company branding
3. pptx-generator skill → Create the presentation
```

## 故障排除

**Q: Skill 没有被加载？**
A: 确保文件夹在 `skills/` 目录下，且包含 `SKILL.md` 文件

**Q: AI 没有正确使用 skill？**
A: 检查 `description` 是否清晰说明了触发场景，提供更多使用示例

**Q: 如何更新 skill？**
A: 直接修改 `SKILL.md` 或子目录中的文件，无需重新加载

**Q: 如何删除 skill？**
A: 使用 `remove_skill(skill_name="...")` 从注册表移除，或直接删除文件夹

## 与 Anthropic 标准的兼容性

本实现完全遵循 Anthropic Agent Skills 标准：
- ✅ 文件夹结构
- ✅ YAML frontmatter
- ✅ SKILL.md 命名
- ✅ 渐进式披露
- ✅ scripts/references/assets 子目录
- ✅ 动态加载机制

## 下一步

- 阅读 [SKILLS_QUICKSTART.md](./SKILLS_QUICKSTART.md) 快速上手
- 查看 `skills/` 目录中的示例 skills
- 探索 [Anthropic Skills 官方文档](https://github.com/anthropics/skills)

## Skills 系统工作原理

### Anthropic Skills 标准架构

Skills 不是工具集合，而是**指令集和知识库**。它们通过以下方式工作：

1. **加载阶段**：系统启动时读取所有 skill 文件夹的 `SKILL.md`
2. **注入阶段**：将 skills 内容添加到 system prompt 中
3. **使用阶段**：AI 根据用户请求自动判断是否使用某个 skill 的指导

### 与传统工具的区别

| 特性 | 传统工具 | Skills |
|------|---------|--------|
| **形式** | 可执行函数 | Markdown 指令 |
| **调用方式** | AI 主动调用 | AI 参考指导后行动 |
| **注册** | Tool Registry | System Prompt |
| **用途** | 执行具体操作 | 提供最佳实践和指导 |

### 示例工作流程

**用户**: "帮我检查一下这个 Git 仓库的状态"

**AI 的思考过程**:
1. 识别任务类型：Git 操作
2. 检查可用的 skills：发现 `git-helper` skill
3. 阅读 skill 中的指导：了解如何正确使用 Git 命令
4. 根据指导执行：使用 `cmd` 工具运行 `git status`

**Skill 的作用**:
- ✅ 告诉 AI 应该检查哪些内容
- ✅ 提供输出格式建议
- ✅ 列出常见陷阱和最佳实践
- ❌ 不直接执行 Git 命令（那是工具的工作）

### 为什么这样设计？

1. **灵活性**：AI 可以根据具体情况灵活应用指导
2. **效率**：避免为每个变体创建新工具
3. **可维护性**：修改指导比修改代码容易
4. **标准化**：符合 Anthropic/Claude 的 Skills 标准

### 何时使用 Skills vs 工具？

**使用 Skills 当**:
- 需要复杂的工作流程指导
- 有多个步骤和决策点
- 需要领域知识和最佳实践
- 输出格式很重要

**使用工具当**:
- 需要执行具体的系统操作
- 有明确的输入输出
- 操作是原子性的
- 需要程序化执行

### 结合使用示例

```
# Code Review Skill (skill)

## Steps
1. Read the file using `read` tool
2. Check for complexity issues
3. Verify naming conventions
4. Look for error handling
5. Provide structured feedback

## Tools to Use
- read: To read source files
- cmd: To run linters if available
```

在这个例子中：
- **Skill** 提供审查流程和标准
- **工具** 执行具体的读取和命令操作
