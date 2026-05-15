/**
 * Skill 元数据 (YAML Frontmatter)
 */
export interface SkillMetadata {
  name: string;              // skill 名称（唯一标识）
  description: string;       // 描述和触发场景
  version?: string;          // 版本号
  author?: string;           // 作者
  tags?: string[];           // 标签
}

/**
 * Skill 定义 - 对应一个文件夹
 */
export interface Skill {
  metadata: SkillMetadata;
  path: string;              // skill 文件夹路径
  content: string;           // SKILL.md 的内容
  hasScripts?: boolean;      // 是否有 scripts 目录
  hasReferences?: boolean;   // 是否有 references 目录
  hasAssets?: boolean;       // 是否有 assets 目录
}

/**
 * SKILL.md 文件结构
 * metadata: SkillMetadata;
 * content: string;
 */
export interface SkillFile {
  metadata: SkillMetadata;   // YAML frontmatter
  content: string;           // Markdown 正文内容
}
