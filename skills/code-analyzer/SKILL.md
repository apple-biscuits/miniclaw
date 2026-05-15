---
name: code-analyzer
description: Analyze code quality, complexity, and structure. Use when user wants to review code quality or identify potential issues.
version: 1.0.0
author: miniclaw
tags: ["code", "analysis", "quality"]
---

# Code Analyzer Skill

This skill provides comprehensive code analysis capabilities to evaluate code quality, identify complexity issues, and suggest improvements.

## When to Use

Use this skill when the user needs to:
- Review code quality and best practices
- Identify complex or hard-to-maintain code
- Check for common anti-patterns
- Get suggestions for code improvements
- Analyze code structure and organization

## Analysis Capabilities

### 1. Code Complexity Analysis
Evaluate cyclomatic complexity and identify overly complex functions.

**Metrics:**
- Cyclomatic complexity score
- Nesting depth
- Function length
- Parameter count

### 2. Code Style Analysis
Check adherence to coding standards and conventions.

**Checks:**
- Naming conventions (camelCase, PascalCase, etc.)
- Indentation consistency
- Line length limits
- Comment quality

### 3. Structure Analysis
Evaluate overall code organization.

**Aspects:**
- Module dependencies
- Coupling between components
- Separation of concerns
- DRY (Don't Repeat Yourself) violations

## How to Use

### Basic Analysis
```
analyze_code(file_path="src/main.ts")
```

### Comprehensive Analysis
```
analyze_code(
  file_path="src/core/agent.ts",
  checks=["complexity", "style", "structure"]
)
```

### Directory-wide Analysis
```
analyze_code(
  directory="src/tools/",
  pattern="*.ts"
)
```

## Output Format

The analysis returns a structured report including:

```markdown
## Analysis Report for [file/directory]

### Summary
- Overall Score: X/10
- Issues Found: N
- Warnings: M

### Critical Issues
1. [Issue description with line numbers]
   - Impact: High/Medium/Low
   - Suggestion: [improvement recommendation]

### Warnings
1. [Warning description]
   - Recommendation: [best practice suggestion]

### Suggestions
- [General improvement suggestions]
```

## Best Practices

1. **Run analysis regularly** during development
2. **Focus on critical issues first** before addressing warnings
3. **Consider context** - some complexity is justified
4. **Track improvements** over time
5. **Use as learning tool** not just criticism

## References

See `references/` directory for:
- `coding-standards.md`: Detailed coding standards reference
- `complexity-metrics.md`: Explanation of complexity metrics
- `common-anti-patterns.md`: Examples of anti-patterns to avoid

## Scripts

Available helper scripts in `scripts/`:
- `calculate-complexity.js`: Calculate cyclomatic complexity
- `check-naming.js`: Validate naming conventions
- `find-duplicates.js`: Detect code duplication

## Notes

- Analysis is advisory, not mandatory
- Balance automated suggestions with human judgment
- Some patterns may be intentional for specific use cases
- Consider project-specific conventions and requirements
