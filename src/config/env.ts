import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import type { MCPServerConfig } from '../mcp/types.ts';

// export const config = {
//   apiKey: process.env.OPENAI_API_KEY || '',
//   baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
//   model: process.env.MODEL || 'gpt-4o',
// };

export const config = {
  // apiKey: 'sk-mbpijkszcptgfxeluwcpkzyskgfajecczetrmopvuoakovzm',
  apiKey:'667778d269e1de52f446e523ff7e34ea:OGIwMzc2YmY4NzhlYzI5ZjNmYjBjZTZm',
  // baseUrl: 'https://api.siliconflow.cn/v1',
  baseUrl: 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2',
  // model: "Qwen/Qwen3-8B",
  model:"astron-code-latest",
  mcpConfigPath: './mcp-servers.json',
};

export function loadMCPConfig(): MCPServerConfig[] {
  const configPath = path.resolve(process.cwd(), config.mcpConfigPath);

  if (!fs.existsSync(configPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const json = JSON.parse(content);

    // Support both array format and { mcpServers: {...} } format
    if (Array.isArray(json)) {
      return json;
    }

    if (json.mcpServers && typeof json.mcpServers === 'object') {
      return Object.entries(json.mcpServers).map(([name, serverConfig]) => ({
        name,
        ...(serverConfig as Omit<MCPServerConfig, 'name'>),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error loading MCP config:', error);
    return [];
  }
}

