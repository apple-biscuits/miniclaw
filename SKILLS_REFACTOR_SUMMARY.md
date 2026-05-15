# Skills 系统重构总结

## 重要变更：采用 Anthropic Agent Skills 标准格式

### 变更原因

根据 Anthropic 官方标准和最佳实践，Skills 应该是**文件夹结构**而不是单一的 JSON 文件。这种设计提供了以下优势：

1. **渐进式披露（Progressive Disclosure）**：分层加载信息，避免上下文窗口浪费
2. **文件系统即上下文工程**：给 AI 一个工作空间，而不是单一指令
3. **模块化组织**：可以包含脚本、参考文档、资源模板等
4. **标准化兼容**：与 Claude Code 和 Anthropic API 完全兼容

### 新旧格式对比

#### ❌ 旧格式（JSON 文件）
```
skills/
├── file_operations.json
└── git_helper.json
```

每个文件包含工具定义数组，缺乏灵活性和可扩展性。

#### ✅ 新格式（文件夹结构 - Anthropic 标准）
```
skills/
├── file-operations/
│   ├── SKILL.md              # 主指令文件（YAML frontmatter + Markdown）
│   ├── scripts/              # 可选：可执行脚本
│   ├── references/           # 可选：参考文档
│   └── assets/               # 可选：模板和资源
├── git-helper/
│   └── SKILL.md
└── code-analyzer/
    ├── SKILL.md
    ├── scripts/
    │   └── calculate-complexity.js
    └── references/
        ├── coding-standards.md
        └── complexity-metrics.md
```

### SKILL.md 文件格式

```markdown
---
name: skill-name
description: 何时使用此技能的描述（触发器）
version: 1.0.0
author: Your Name
tags: ["tag1", "tag2"]
---

# Skill 标题

详细的指令、示例、约束规则...

## 何时使用
说明触发场景...

## 使用方法
具体步骤和示例...

## 最佳实践
建议和注意事项...
```

### 核心改进

#### 1. 三层加载机制

- **Layer 1 - YAML Frontmatter**：始终加载，用于快速路由匹配
- **Layer 2 - SKILL.md 正文**：条件加载，提供详细指令
- **Layer 3 - 子目录内容**：按需加载，AI 根据需要读取 scripts/references/assets

#### 2. 更智能的触发机制

`description` 字段不再是简单的摘要，而是**触发器**，告诉 AI 在什么情况下应该使用这个 skill。

**好的 description：**
```yaml
description: Analyze code quality and identify complexity issues. Use when user wants to review code or find potential problems.
```

**差的 description：**
```yaml
description: A tool for code analysis
```

#### 3. 丰富的资源组织

- **scripts/**: 存放可执行脚本（JavaScript, Python, Bash 等）
- **references/**: 存放参考文档、API 文档、编码规范
- **assets/**: 存放模板文件、图标、字体等资源

### API 变更

#### 新增的工具

1. **create_skill** - 创建 skill 文件夹
   ```javascript
   create_skill(
     name="my-skill",
     description="...",
     content="# Markdown content...",
     author="Name",
     tags=["tag1"]
   )
   ```

2. **load_skill** - 从文件夹加载（参数改为 `folder_path`）
   ```javascript
   load_skill(folder_path="./skills/my-skill")
   ```

3. **get_skill_info** - 获取 skill 详细信息（包括子目录内容）
   ```javascript
   get_skill_info(skill_name="code-analyzer")
   ```

#### 移除的功能

- ~~保存 skill 到 JSON 文件~~（不再需要，skill 本身就是文件夹）
- ~~从 JSON 文件加载~~（改为从文件夹加载）

### 迁移指南

如果你之前创建了 JSON 格式的 skills，需要手动迁移：

1. **为每个 JSON skill 创建文件夹**
   ```bash
   mkdir -p skills/file-operations
   ```

2. **创建 SKILL.md 文件**
   ```markdown
   ---
   name: file-operations
   description: Advanced file operations
   version: 1.0.0
   ---

   # File Operations Skill
   
   [从原 JSON 的 description 扩展而来的详细说明]
   ```

3. **移动相关资源到子目录**
   ```bash
   # 如果有脚本或文档
   mv my-script.js skills/file-operations/scripts/
   mv docs.md skills/file-operations/references/
   ```

4. **删除旧的 JSON 文件**
   ```bash
   rm skills/file_operations.json
   ```

### 示例 Skills

项目中已创建 3 个符合新标准的示例 skills：

1. **file-operations/** - 文件操作技能
   - 备份、复制、移动文件
   - 简洁的 SKILL.md

2. **git-helper/** - Git 助手
   - 状态检查、日志查看、差异比较
   - 包含工作流程示例

3. **code-analyzer/** - 代码分析器（完整示例）
   - SKILL.md：主指令
   - scripts/calculate-complexity.js：复杂度计算脚本
   - references/coding-standards.md：编码规范
   - references/complexity-metrics.md：复杂度指标说明

### 技术实现

#### 修改的文件

1. **src/skills/types.ts**
   - 更新类型定义以支持文件夹结构
   - 添加 `path`, `content`, `hasScripts` 等字段

2. **src/skills/manager.ts**
   - 重写为支持文件夹格式
   - 添加 YAML frontmatter 解析
   - 实现渐进式加载机制
   - 添加子目录检测

3. **src/skills/index.ts**
   - 更新工具定义以适配新格式
   - 添加 `get_skill_info` 工具
   - 修改参数名称（`folder_path` 代替 `file_path`）

#### 关键函数

- `parseSkillFile()`: 解析 SKILL.md，提取 YAML frontmatter 和 Markdown 内容
- `loadSkillFromFolder()`: 从文件夹加载 skill
- `createSkillFolder()`: 创建完整的 skill 文件夹结构
- `getSkillFullInfo()`: 获取 skill 及其子目录的完整信息

### 优势总结

| 特性 | 旧格式 (JSON) | 新格式 (文件夹) |
|------|--------------|----------------|
| 组织结构 | 扁平，单一文件 | 分层，模块化 |
| 可扩展性 | 有限 | 强大（可添加脚本、文档、资源） |
| 上下文效率 | 低（一次性加载全部） | 高（渐进式披露） |
| 标准化 | 自定义格式 | Anthropic 标准 |
| 可维护性 | 困难 | 容易 |
| 资源共享 | 不支持 | 原生支持 |
| AI 理解度 | 一般 | 优秀（结构化信息） |

### 下一步建议

1. **阅读文档**
   - [SKILLS_GUIDE.md](./SKILLS_GUIDE.md) - 完整使用指南
   - [SKILLS_QUICKSTART.md](./SKILLS_QUICKSTART.md) - 5 分钟快速上手

2. **查看示例**
   - 浏览 `skills/` 目录中的 3 个示例 skills
   - 特别关注 `code-analyzer/` 的完整结构

3. **创建自己的 skills**
   - 使用 `create_skill` 工具
   - 遵循 Anthropic 最佳实践
   - 充分利用子目录组织资源

4. **参考官方资源**
   - [Anthropic Skills 官方仓库](https://github.com/anthropics/skills)
   - [Agent Skills 标准](https://agentskills.io/)

### 兼容性说明

本实现完全兼容 Anthropic Agent Skills 标准：
- ✅ 文件夹结构
- ✅ YAML frontmatter
- ✅ SKILL.md 命名规范
- ✅ 渐进式披露架构
- ✅ scripts/references/assets 子目录
- ✅ kebab-case 命名约定

可以与 Claude Code、Claude.ai 和其他支持 Agent Skills 的平台无缝集成。
