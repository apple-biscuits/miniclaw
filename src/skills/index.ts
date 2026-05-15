import type { Tool } from '../tools/types.ts';
import { SkillManager } from './manager.ts';
import type { SkillMetadata } from './types.ts';

/**
 * 创建 skill 管理工具集（适配文件夹格式）
 */
export function createSkillTools(skillManager: SkillManager): Tool[] {
  // 1. create_skill - 创建新 skill 文件夹
  const createSkillTool: Tool = {
    definition: {
      name: 'create_skill',
      description: 'Create a new skill folder with SKILL.md and optional subdirectories',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the skill (will be converted to kebab-case for folder name)',
          },
          description: {
            type: 'string',
            description: 'Description of what this skill does and when to use it',
          },
          author: {
            type: 'string',
            description: 'Author of the skill (optional)',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Tags for categorizing the skill (optional)',
          },
          content: {
            type: 'string',
            description: 'Markdown content for SKILL.md (instructions, examples, constraints)',
          },
        },
        required: ['name', 'description', 'content'],
      },
    },

    async execute(args: Record<string, unknown>): Promise<string> {
      try {
        const metadata: Omit<SkillMetadata, 'version'> = {
          name: args.name as string,
          description: args.description as string,
          author: args.author as string | undefined,
          tags: args.tags as string[] | undefined,
        };

        const content = args.content as string;

        const folderPath = await skillManager.createSkillFolder(metadata, content);
        
        return `Skill folder created at: ${folderPath}\n\nStructure:\n- SKILL.md (main instruction file)\n- scripts/ (for executable scripts)\n- references/ (for reference documentation)\n- assets/ (for templates and resources)\n\nYou can now add files to these directories as needed.`;
      } catch (error) {
        return `Failed to create skill: ${(error as Error).message}`;
      }
    },
  };

  // 2. load_skill - 从文件夹加载 skill
  const loadSkillTool: Tool = {
    definition: {
      name: 'load_skill',
      description: 'Load a skill from a folder containing SKILL.md',
      parameters: {
        type: 'object',
        properties: {
          folder_path: {
            type: 'string',
            description: 'Path to the skill folder (must contain SKILL.md)',
          },
        },
        required: ['folder_path'],
      },
    },

    async execute(args: Record<string, unknown>): Promise<string> {
      try {
        const folderPath = args.folder_path as string;
        const skill = await skillManager.loadSkillFromFolder(folderPath);
        
        let info = `Skill "${skill.metadata.name}" loaded successfully.\n`;
        info += `Description: ${skill.metadata.description}\n`;
        if (skill.hasScripts) info += `- Has scripts/ directory\n`;
        if (skill.hasReferences) info += `- Has references/ directory\n`;
        if (skill.hasAssets) info += `- Has assets/ directory\n`;
        
        return info;
      } catch (error) {
        return `Failed to load skill: ${(error as Error).message}`;
      }
    },
  };

  // 3. list_skills - 列出所有已注册的 skills
  const listSkillsTool: Tool = {
    definition: {
      name: 'list_skills',
      description: 'List all registered skills',
      parameters: {
        type: 'object',
        properties: {},
      },
    },

    async execute(): Promise<string> {
      const skills = skillManager.getSkills();
      if (skills.length === 0) {
        return 'No skills registered.';
      }

      const skillList = skills.map(s => {
        let info = `- ${s.metadata.name} v${s.metadata.version || '1.0.0'}: ${s.metadata.description}`;
        const features = [];
        if (s.hasScripts) features.push('scripts');
        if (s.hasReferences) features.push('references');
        if (s.hasAssets) features.push('assets');
        if (features.length > 0) {
          info += ` [${features.join(', ')}]`;
        }
        return info;
      }).join('\n');

      return `Registered skills:\n${skillList}`;
    },
  };

  // 4. get_skill_info - 获取 skill 详细信息
  const getSkillInfoTool: Tool = {
    definition: {
      name: 'get_skill_info',
      description: 'Get detailed information about a specific skill including its files',
      parameters: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description: 'Name of the skill',
          },
        },
        required: ['skill_name'],
      },
    },

    async execute(args: Record<string, unknown>): Promise<string> {
      try {
        const skillName = args.skill_name as string;
        const info = await skillManager.getSkillFullInfo(skillName);
        
        let result = `Skill: ${info.skill.metadata.name}\n`;
        result += `Version: ${info.skill.metadata.version || '1.0.0'}\n`;
        result += `Description: ${info.skill.metadata.description}\n`;
        result += `Path: ${info.skill.path}\n\n`;
        
        if (info.scripts && info.scripts.length > 0) {
          result += `Scripts:\n${info.scripts.map(s => `  - ${s}`).join('\n')}\n\n`;
        }
        
        if (info.references && info.references.length > 0) {
          result += `References:\n${info.references.map(r => `  - ${r}`).join('\n')}\n\n`;
        }
        
        if (info.assets && info.assets.length > 0) {
          result += `Assets:\n${info.assets.map(a => `  - ${a}`).join('\n')}\n\n`;
        }
        
        result += `\nSKILL.md Preview (first 500 chars):\n${info.skill.content.substring(0, 500)}...`;
        
        return result;
      } catch (error) {
        return `Failed to get skill info: ${(error as Error).message}`;
      }
    },
  };

  // 5. remove_skill - 移除 skill
  const removeSkillTool: Tool = {
    definition: {
      name: 'remove_skill',
      description: 'Remove a registered skill (does not delete the folder)',
      parameters: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description: 'Name of the skill to remove',
          },
        },
        required: ['skill_name'],
      },
    },

    async execute(args: Record<string, unknown>): Promise<string> {
      const skillName = args.skill_name as string;
      const removed = skillManager.unregisterSkill(skillName);
      
      if (removed) {
        return `Skill "${skillName}" removed from registry. (Folder still exists on disk)`;
      } else {
        return `Skill "${skillName}" not found.`;
      }
    },
  };

  return [createSkillTool, loadSkillTool, listSkillsTool, getSkillInfoTool, removeSkillTool];
}

export { SkillManager } from './manager.ts';
export type { Skill, SkillMetadata, SkillFile } from './types.ts';
