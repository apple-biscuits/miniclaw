import { SkillManager } from '../src/skills/manager.ts';
import chalk from 'chalk';

async function testSkills() {
  console.log(chalk.cyan('Testing Skills System...\n'));

  const manager = new SkillManager('./skills');
  
  // 初始化
  await manager.initialize();
  console.log(chalk.green('✓ Skills directory initialized\n'));

  // 加载所有 skills
  await manager.loadAllSkills();
  console.log(chalk.green(`✓ Loaded ${manager.getSkillNames().length} skills\n`));

  // 列出所有 skills
  const skillNames = manager.getSkillNames();
  console.log(chalk.yellow('Registered skills:'));
  skillNames.forEach(name => {
    const skill = manager.getSkill(name);
    if (skill) {
      console.log(chalk.gray(`  - ${name} v${skill.metadata.version}: ${skill.metadata.description}`));
      console.log(chalk.gray(`    Tools: ${skill.tools.length}`));
    }
  });
  console.log();

  // 测试创建新 skill
  console.log(chalk.yellow('Creating a test skill...'));
  const testSkill = manager.createSkill(
    {
      name: 'test_skill',
      description: 'A test skill for demonstration',
      author: 'Test User',
      tags: ['test', 'demo'],
    },
    [
      {
        name: 'test_tool',
        description: 'A test tool',
        parameters: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Test message',
            },
          },
          required: ['message'],
        },
      },
    ]
  );

  await manager.saveSkillToFile(testSkill);
  console.log(chalk.green('✓ Test skill created and saved\n'));

  // 清理测试 skill
  manager.unregisterSkill('test_skill');
  console.log(chalk.yellow('Test completed!\n'));
}

testSkills().catch((error) => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});
