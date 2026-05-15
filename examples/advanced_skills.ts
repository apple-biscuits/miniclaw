/**
 * 高级 Skills 使用示例
 * 
 * 这个文件展示了如何创建带有自定义执行逻辑的 skills
 */

import { SkillManager } from '../skills/manager.ts';
import type { Skill } from '../skills/types.ts';
import type { ToolDefinition } from '../tools/types.ts';

/**
 * 示例 1: 创建一个带有自定义执行逻辑的 skill
 */
export async function createAdvancedSkillExample(): Promise<void> {
  const manager = new SkillManager('./skills');
  await manager.initialize();

  // 定义工具
  const tools: ToolDefinition[] = [
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate',
          },
        },
        required: ['expression'],
      },
    },
    {
      name: 'format_date',
      description: 'Format a date string',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date to format',
          },
          format: {
            type: 'string',
            description: 'Output format (default: YYYY-MM-DD)',
          },
        },
        required: ['date'],
      },
    },
  ];

  // 创建 skill
  const skill: Skill = {
    metadata: {
      name: 'math_utils',
      description: 'Mathematical and utility functions',
      version: '1.0.0',
      author: 'miniclaw',
      tags: ['math', 'utility'],
    },
    tools,
    // 自定义执行逻辑
    execute: async (toolName: string, args: Record<string, unknown>): Promise<string> => {
      try {
        switch (toolName) {
          case 'calculate':
            const expression = args.expression as string;
            // 注意：在生产环境中应该使用安全的表达式解析库
            const result = Function('"use strict"; return (' + expression + ')')();
            return `Result: ${result}`;

          case 'format_date':
            const date = new Date(args.date as string);
            const format = (args.format as string) || 'YYYY-MM-DD';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            let formatted = format
              .replace('YYYY', String(year))
              .replace('MM', month)
              .replace('DD', day);
            
            return `Formatted date: ${formatted}`;

          default:
            return `Unknown tool: ${toolName}`;
        }
      } catch (error) {
        return `Error executing ${toolName}: ${(error as Error).message}`;
      }
    },
  };

  // 注册并保存
  manager.registerSkill(skill);
  await manager.saveSkillToFile(skill);

  console.log('Advanced skill created and saved!');
}

/**
 * 示例 2: 动态加载和使用 skill
 */
export async function loadAndUseSkillExample(): Promise<void> {
  const manager = new SkillManager('./skills');
  await manager.initialize();

  // 加载 skill
  const skill = await manager.loadSkillFromFile('./skills/math_utils.json');
  
  // 转换为可执行工具
  const executableTools = manager.convertToExecutableTools(skill);
  
  console.log(`Loaded skill "${skill.metadata.name}" with ${executableTools.length} tools`);
  
  // 这里可以将工具注册到 Agent 中使用
  // agent.registerTool(executableTools[0]);
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdvancedSkillExample().catch(console.error);
}
