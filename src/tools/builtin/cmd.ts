import { spawn } from 'child_process';
import type { Tool } from '../types.ts';

export const cmdTool: Tool = {
  definition: {
    name: 'powershell',
    description: 'Execute a PowerShell command on windows and return the output!must be powershell command',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The PowerShell command to execute',
        },
      },
      required: ['command'],
    },
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const command = args.command as string;
    // const encoded = Buffer.from(command, 'utf16le').toString('base64');
    return new Promise((resolve) => {
      const proc = spawn('powershell', [        
        '-NoProfile',       // 不加载用户 profile，启动更快
        '-NonInteractive',  // 不等待用户输入
        '-Command',
        command], {
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout || 'Command executed successfully (no output)');
        } else {
          resolve(`Exit code ${code}\n${stderr || stdout}`);
        }
      });

      proc.on('error', (err) => {
        resolve(`Error: ${err.message}`);
      });
    });
  },
};