# Skills 系统集成修复说明

## 问题

在将 Skills 重构为 Anthropic 标准格式（文件夹结构）后，Agent 中仍然调用了已删除的 `convertToExecutableTools()` 方法，导致编译错误：

```
类型"SkillManager"上不存在属性"convertToExecutableTools"。
```

## 根本原因

**概念混淆**：旧实现将 Skills 视为"工具集合"，新标准将 Skills 视为"指令集"。

### 旧方式（错误）❌
```typescript
// Skill 包含工具定义数组
interface Skill {
  tools: ToolDefinition[];  // ❌ 这不是 Anthropic 标准
}

// 转换为可执行工具
const executableTools = skillManager.convertToExecutableTools(skill);
agent.registerTool(executableTools[0]);
```

### 新方式（正确）✅
```typescript
// Skill 是指令文件
interface Skill {
  content: string;  // ✅ SKILL.md 的 Markdown 内容
}

// 注入到 system prompt
await injectSkillsToSystemPrompt();
```

## 解决方案

### 1. 修改 Agent 集成方式

**删除**：
- ~~`registerLoadedSkillTools()` 方法~~
- ~~`convertToExecutableTools()` 调用~~

**新增**：
```typescript
private async injectSkillsToSystemPrompt(): Promise<void> {
  const skills = this.skillManager.getSkills();
  
  let skillsSection = '\n\n## Available Skills\n\n';
  
  for (const skill of skills) {
    skillsSection += `### ${skill.metadata.name}\n`;
    skillsSection += `**Description**: ${skill.metadata.description}\n`;
    skillsSection += `\n${skill.content.substring(0, 2000)}\n`;
    
    if (skill.hasScripts || skill.hasReferences || skill.hasAssets) {
      skillsSection += `\n**Available Resources**: scripts/, references/, assets/\n`;
    }
  }

  // 追加到 system prompt
  (conversation as any).systemPrompt += skillsSection;
}
```

### 2. 工作流程

```
启动应用
  ↓
加载所有 skill 文件夹
  ↓
读取每个 skill 的 SKILL.md
  ↓
将 skills 内容注入 system prompt
  ↓
AI 在对话时可以看到并使用这些指导
```

## Anthropic Skills 标准架构

### Skills 是什么？

Skills 是**系统提示的扩展**，不是工具。它们提供：
- 📋 工作流程指导
- 🎯 最佳实践
- 📝 输出格式规范
- ⚠️ 常见陷阱警告

### Skills 不是什么？

- ❌ 不是可执行函数
- ❌ 不是工具集合
- ❌ 不需要注册到 Tool Registry

### 正确使用方式

**用户请求**: "帮我做代码审查"

**AI 的行为**:
1. 看到 system prompt 中的 `code-reviewer` skill
2. 阅读 skill 中的指导步骤
3. 根据指导使用现有工具（`read`, `cmd` 等）
4. 按照 skill 建议的格式输出结果

```markdown
# Code Reviewer Skill

## Steps
1. Use `read` tool to read the file
2. Check complexity using guidelines
3. Verify naming conventions
4. Provide structured feedback

## Output Format
- Summary
- Critical Issues
- Warnings
- Suggestions
```

## 技术细节

### System Prompt 结构

```
[Original System Prompt]

## Available Skills

### git-helper
**Description**: Git operations helper...

[SKILL.md content - first 2000 chars]

**Available Resources**: scripts/, references/

---

### code-analyzer
**Description**: Analyze code quality...

[SKILL.md content - first 2000 chars]

**Available Resources**: scripts/, references/, assets/

---
```

### 上下文管理

为避免 skills 占用过多上下文：
- ✅ 只注入 SKILL.md 的前 2000 字符
- ✅ AI 可以使用 `read` 工具按需读取完整内容
- ✅ 告知 AI 有哪些资源可用（scripts/references/assets）

### 动态加载

如果 skill 内容很长或有很多资源：
```markdown
# Skill with Resources

For detailed API documentation, read:
- references/api-spec.md
- references/examples.md

For helper scripts, use:
- scripts/validate.js
- scripts/generate.js
```

AI 会在需要时使用 `read` 工具获取详细内容。

## 优势对比

| 特性 | 旧方式（工具） | 新方式（指令） |
|------|--------------|--------------|
| **灵活性** | 低（固定工具） | 高（AI 自主决策） |
| **可维护性** | 难（需改代码） | 易（改 Markdown） |
| **上下文效率** | 低（全部加载） | 高（渐进式披露） |
| **标准化** | 自定义 | Anthropic 标准 |
| **复用性** | 项目内 | 跨平台通用 |

## 示例对比

### 旧方式（错误）

```json
{
  "name": "git-helper",
  "tools": [
    {
      "name": "git_status",
      "execute": "run git status command"
    }
  ]
}
```

### 新方式（正确）

```markdown
---
name: git-helper
description: Git operations helper
---

# Git Helper

When user needs Git operations:

1. Use `cmd` tool to run git commands
2. Common commands:
   - `git status` - Check repository state
   - `git log --oneline -10` - View recent commits
   - `git diff HEAD~1` - See last commit changes

## Best Practices
- Always check status before operations
- Use --oneline for concise logs
- Handle errors gracefully
```

## 迁移检查清单

如果你之前使用了旧的工具方式：

- [ ] 移除 Skill 中的 `tools` 数组定义
- [ ] 将工具逻辑改为 Markdown 指令
- [ ] 说明应该使用哪些现有工具
- [ ] 提供工作流程和最佳实践
- [ ] 添加输出格式示例
- [ ] 列出可用的参考资源

## 相关文件

- ✅ `src/core/agent.ts` - 已修复，使用 `injectSkillsToSystemPrompt()`
- ✅ `src/skills/manager.ts` - 支持文件夹格式
- ✅ `src/skills/types.ts` - 更新类型定义
- ✅ `skills/*/SKILL.md` - 符合 Anthropic 标准

## 测试验证

```bash
# 启动应用
pnpm dev

# 在对话中测试
>>> list_skills()
>>> get_skill_info(skill_name="git-helper")
>>> 帮我检查一下当前目录的 git 状态
```

AI 应该能够：
1. 识别需要使用 git-helper skill
2. 根据 skill 指导选择正确的 git 命令
3. 使用 `cmd` 工具执行命令
4. 按照 skill 建议的格式展示结果

## 总结

这次修复不仅仅是解决编译错误，更是**正确实现了 Anthropic Skills 标准**：

- ✅ Skills 是指令集，不是工具集合
- ✅ 通过 system prompt 注入，不是工具注册
- ✅ 提供指导和最佳实践，不是执行逻辑
- ✅ 与现有工具协同工作，不是替代工具

这种设计让 Skills 更加灵活、可维护，并且完全兼容 Anthropic/Claude 生态系统。
