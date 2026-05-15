# Skills 快速开始指南

## 5 分钟上手 Skills（Anthropic 标准格式）

### 1. 启动应用

```bash
pnpm dev
```

系统会自动初始化 skills 系统并加载 `skills/` 目录下的所有 skill **文件夹**。

### 2. 查看可用的 skills

在对话中输入：
```
list_skills()
```

你会看到类似这样的输出：
```
Registered skills:
- file-operations v1.0.0: Advanced file operations including backup, copy, and move
- git-helper v1.0.0: Git operations helper for checking status and viewing history
- code-analyzer v1.0.0: Analyze code quality and complexity [scripts, references, assets]
```

### 3. 了解 skill 的详细信息

```
get_skill_info(skill_name="code-analyzer")
```

输出：
```
Skill: code-analyzer
Version: 1.0.0
Description: Analyze code quality, complexity, and structure
Path: ./skills/code-analyzer

Scripts:
  - calculate-complexity.js

References:
  - coding-standards.md
  - complexity-metrics.md

SKILL.md Preview (first 500 chars):
# Code Analyzer Skill

This skill provides comprehensive code analysis...
```

### 4. 创建你的第一个 skill

**用户**: "创建一个 API 测试 skill"

**AI** 会调用:
```javascript
create_skill(
  name="api-tester",
  description="Test REST APIs with various HTTP methods. Use when user needs to test API endpoints or debug API issues.",
  author="Your Name",
  tags=["api", "testing", "http"],
  content=`# API Tester Skill

## When to Use
Use this skill when the user needs to:
- Test REST API endpoints
- Debug API issues
- Validate API responses

## Available Methods
- GET: Retrieve data from endpoints
- POST: Create new resources
- PUT/PATCH: Update existing resources
- DELETE: Remove resources

## Example Usage
\`\`\`
test_api(method="GET", url="https://api.example.com/users")
test_api(method="POST", url="https://api.example.com/users", body={name: "John"})
\`\`\`

## Best Practices
1. Always check response status codes
2. Validate response schemas
3. Handle errors gracefully
4. Log request/response for debugging
`
)
```

这会在 `skills/api-tester/` 目录下创建完整的文件夹结构：
```
skills/api-tester/
├── SKILL.md              # 主指令文件
├── scripts/              # 可放测试脚本
├── references/           # 可放 API 文档
└── assets/               # 可放请求模板
```

### 5. 向 skill 添加资源

创建 skill 后，你可以手动添加文件到子目录：

```bash
# 添加参考文档
cat > skills/api-tester/references/http-status-codes.md << 'EOF'
# HTTP Status Codes Reference

## Success (2xx)
- 200 OK
- 201 Created
- 204 No Content

## Client Errors (4xx)
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found

## Server Errors (5xx)
- 500 Internal Server Error
- 503 Service Unavailable
EOF

# 添加测试脚本
cat > skills/api-tester/scripts/test-endpoint.js << 'EOF'
const fetch = require('node-fetch');

async function testEndpoint(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      status: response.status,
      statusText: response.statusText,
      data
    };
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = { testEndpoint };
EOF
```

### 6. 使用 skill

Skill 被加载后，AI 会根据用户请求自动使用。

**用户**: "帮我测试一下 https://jsonplaceholder.typicode.com/posts 这个 API"

**AI**: （识别到 API 测试任务，使用 api-tester skill）
```
我将使用 api-tester skill 来测试这个 API...

根据 skill 的指导，我会：
1. 发送 GET 请求到该端点
2. 检查响应状态码
3. 验证返回的数据结构

test_api(method="GET", url="https://jsonplaceholder.typicode.com/posts")
```

## 常见场景

### 场景 1: 为项目创建专用工具集

```javascript
create_skill(
  name="project-x-workflow",
  description="Project X specific workflows and conventions. Use when working on Project X tasks.",
  author="Team X",
  tags=["project-x", "workflow"],
  content=`# Project X Workflow

## Project Structure
- src/ - Source code
- tests/ - Test files
- docs/ - Documentation

## Coding Standards
[Reference coding-standards.md in references/]

## Deployment Process
1. Run tests
2. Build production bundle
3. Deploy to staging
4. Run integration tests
5. Deploy to production
`
)
```

### 场景 2: 加载外部 skill

如果你从 GitHub 或其他来源下载了一个 skill 文件夹：

```
load_skill(folder_path="./downloads/community-skill")
```

### 场景 3: 查看 skill 有哪些资源

```
get_skill_info(skill_name="code-analyzer")
```

这会显示 skill 包含的所有文件和目录。

## 提示和技巧

💡 **理解文件夹结构的优势**
- 给 AI 一个工作空间，而不是单一指令
- AI 可以按需读取不同的参考资料
- 可以存放示例、模板、脚本等资源

💡 **渐进式披露是关键**
- Frontmatter 保持简洁（让 AI 快速判断）
- SKILL.md 提供详细指导
- references/ 放详细内容（AI 需要时再读）

💡 **Description 是触发器**
- 不是给人看的摘要
- 是告诉 AI "在什么情况下使用我"
- 包含具体的触发场景

💡 **命名规范**
- 使用 kebab-case（短横线小写）
- 名称要有意义
- 避免与现有 skill 冲突

## 故障排除

**Q: Skill 没有被加载？**
A: 确保文件夹在 `skills/` 目录下且包含 `SKILL.md` 文件（注意大小写）

**Q: AI 没有正确使用 skill？**
A: 
- 检查 `description` 是否清晰说明了触发场景
- 在 SKILL.md 中提供更多具体示例
- 确保 YAML frontmatter 格式正确

**Q: 如何修改 skill？**
A: 直接编辑 `SKILL.md` 或子目录中的文件，无需重新加载

**Q: 如何删除 skill？**
A: 
- 从注册表移除：`remove_skill(skill_name="my-skill")`
- 完全删除：删除整个文件夹

## 下一步

- 阅读 [SKILLS_GUIDE.md](./SKILLS_GUIDE.md) 了解详细用法和设计原则
- 查看 `skills/` 目录中的示例 skills 学习最佳实践
- 探索 [Anthropic Skills 官方仓库](https://github.com/anthropics/skills)
