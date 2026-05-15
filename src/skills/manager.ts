import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import type { Skill, SkillFile, SkillMetadata } from './types.ts';

/**
 * 解析 SKILL.md 文件，提取 YAML frontmatter 和 Markdown 内容
 */
function parseSkillFile(content: string): SkillFile {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('Invalid SKILL.md format: missing YAML frontmatter');
  }
  
  const [, yamlContent, markdownContent] = match;
  
  // 简单的 YAML 解析（生产环境建议使用 js-yaml 库）
  const metadata: SkillMetadata = {
    name: '',
    description: '',
  };
  
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('name:')) {
      metadata.name = trimmed.substring(5).trim().replace(/["']/g, '');
    } else if (trimmed.startsWith('description:')) {
      metadata.description = trimmed.substring(12).trim().replace(/["']/g, '');
    } else if (trimmed.startsWith('version:')) {
      metadata.version = trimmed.substring(8).trim().replace(/["']/g, '');
    } else if (trimmed.startsWith('author:')) {
      metadata.author = trimmed.substring(7).trim().replace(/["']/g, '');
    } else if (trimmed.startsWith('tags:')) {
      // 简单解析 tags 数组
      const tagsStr = trimmed.substring(5).trim();
      if (tagsStr.startsWith('[') && tagsStr.endsWith(']')) {
        metadata.tags = tagsStr.slice(1, -1).split(',').map(t => t.trim().replace(/["']/g, ''));
      }
    }
  }
  
  return {
    metadata,
    content: markdownContent.trim(),
  };
}

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;

  constructor(skillsDir: string = './skills') {
    this.skillsDir = skillsDir;
  }

  /**
   * 初始化 skills 目录
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.skillsDir, { recursive: true });
      console.log(chalk.gray(`Skills directory: ${this.skillsDir}`));
    } catch (error) {
      console.error(chalk.red(`Failed to create skills directory: ${(error as Error).message}`));
    }
  }

  /**
   * 从文件夹加载 skill
   */
  async loadSkillFromFolder(folderPath: string): Promise<Skill> {
    try {
      const folderName = path.basename(folderPath);
      const skillMdPath = path.join(folderPath, 'SKILL.md');
      
      // 检查 SKILL.md 是否存在
      await fs.access(skillMdPath);
      
      // 读取 SKILL.md
      const content = await fs.readFile(skillMdPath, 'utf-8');
      const { metadata, content: markdownContent } = parseSkillFile(content);
      
      // 检查子目录
      const hasScripts = await this.directoryExists(path.join(folderPath, 'scripts'));
      const hasReferences = await this.directoryExists(path.join(folderPath, 'references'));
      const hasAssets = await this.directoryExists(path.join(folderPath, 'assets'));
      
      const skill: Skill = {
        metadata,
        path: folderPath,
        content: markdownContent,
        hasScripts,
        hasReferences,
        hasAssets,
      };
      
      this.registerSkill(skill);
      return skill;
    } catch (error) {
      throw new Error(`Failed to load skill from ${folderPath}: ${(error as Error).message}`);
    }
  }

  /**
   * 检查目录是否存在
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 注册一个 skill（在内存中）
   */
  registerSkill(skill: Skill): void {
    this.skills.set(skill.metadata.name, skill);
    console.log(chalk.green(`Skill registered: ${skill.metadata.name} v${skill.metadata.version || '1.0.0'}`));
  }

  /**
   * 注销一个 skill
   */
  unregisterSkill(name: string): boolean {
    return this.skills.delete(name);
  }

  /**
   * 获取所有已注册的 skills
   */
  getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * 获取 skill 名称列表
   */
  getSkillNames(): string[] {
    return Array.from(this.skills.keys());
  }

  /**
   * 获取特定 skill
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * 从 skills 目录加载所有 skills（每个子文件夹是一个 skill）
   */
  async loadAllSkills(): Promise<void> {
    try {
      const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderPath = path.join(this.skillsDir, entry.name);
          try {
            await this.loadSkillFromFolder(folderPath);
          } catch (error) {
            console.error(chalk.yellow(`Warning: Failed to load skill from ${entry.name}: ${(error as Error).message}`));
          }
        }
      }
    } catch (error) {
      console.error(chalk.red(`Failed to load skills: ${(error as Error).message}`));
    }
  }

  /**
   * 创建一个新的 skill 文件夹结构
   */
  async createSkillFolder(metadata: Omit<SkillMetadata, 'version'>, content: string): Promise<string> {
    try {
      const folderName = metadata.name.replace(/\s+/g, '-').toLowerCase();
      const folderPath = path.join(this.skillsDir, folderName);
      
      // 创建文件夹
      await fs.mkdir(folderPath, { recursive: true });
      
      // 创建 SKILL.md
      const version = '1.0.0';
      const skillMdContent = `---
name: ${metadata.name}
description: ${metadata.description}
version: ${version}${metadata.author ? `\nauthor: ${metadata.author}` : ''}${metadata.tags && metadata.tags.length > 0 ? `\ntags: [${metadata.tags.map(t => `"${t}"`).join(', ')}]` : ''}
---

${content}
`;
      
      await fs.writeFile(path.join(folderPath, 'SKILL.md'), skillMdContent, 'utf-8');
      
      // 创建可选的子目录
      await fs.mkdir(path.join(folderPath, 'scripts'), { recursive: true });
      await fs.mkdir(path.join(folderPath, 'references'), { recursive: true });
      await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
      
      console.log(chalk.green(`Skill folder created: ${folderPath}`));
      return folderPath;
    } catch (error) {
      throw new Error(`Failed to create skill folder: ${(error as Error).message}`);
    }
  }

  /**
   * 获取 skill 的完整信息（包括按需加载的文件）
   */
  async getSkillFullInfo(skillName: string): Promise<{
    skill: Skill;
    scripts?: string[];
    references?: string[];
    assets?: string[];
  }> {
    const skill = this.getSkill(skillName);
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }
    
    const result: any = { skill };
    
    // 按需加载 scripts
    if (skill.hasScripts) {
      const scriptsPath = path.join(skill.path, 'scripts');
      const scripts = await fs.readdir(scriptsPath);
      result.scripts = scripts;
    }
    
    // 按需加载 references
    if (skill.hasReferences) {
      const refsPath = path.join(skill.path, 'references');
      const references = await fs.readdir(refsPath);
      result.references = references;
    }
    
    // 按需加载 assets
    if (skill.hasAssets) {
      const assetsPath = path.join(skill.path, 'assets');
      const assets = await fs.readdir(assetsPath);
      result.assets = assets;
    }
    
    return result;
  }
}
