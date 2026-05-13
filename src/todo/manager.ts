import chalk from "chalk";
import type { Todo, TodoStatus } from "./types.ts";




export class TodoManager{
    private todos: Todo[] = [];

    setTodos(todos: Todo[]):void {
        this.todos = todos;
        this.render();
    }
    getTodos(): Todo[] {
        return this.todos;
    }

    addTodo(content: string): void {
        this.todos.push({ content, status: 'pending' });
        this.render();
    }
    updateStatus(index:number,status:TodoStatus):void {
        if (index < 0 || index >= this.todos.length) {
            throw new Error("Invalid index");
        }
        this.todos[index].status = status;
        this.render();
    }

    removeTodo(index:number):void {
        if (index < 0 || index >= this.todos.length) {
            throw new Error("Invalid index");
        }
        this.todos.splice(index, 1);
        this.render();
    }

    clear(): void {
        this.todos = [];
    }

    render(): void {
        if(this.todos.length === 0) return;
        console.log(chalk.cyan('\n📋 TODO List:'));
        console.log(chalk.gray('─'.repeat(40)));
        this.todos.forEach((todo, index) => {
            const statusIcon = this.getStatusIcon(todo.status);
            const statusColor = this.getStatusColor(todo.status);
            console.log(`${index + 1}. ${statusColor(statusIcon)} ${todo.content}`);
        });

         console.log(chalk.gray('─'.repeat(40)));

         //summary
         const completed = this.todos.filter((t) => t.status === 'completed').length;
        const inProgress = this.todos.filter((t) => t.status === 'in_progress').length;
        const pending = this.todos.filter((t) => t.status === 'pending').length;
        const parts: string[] = [];
        if (completed > 0) parts.push(chalk.green(`${completed} done`));
        if (inProgress > 0) parts.push(chalk.yellow(`${inProgress} in progress`));
        if (pending > 0) parts.push(chalk.gray(`${pending} pending`));
        console.log(`  ${parts.join(' | ')}\n`);
    }

      private getStatusIcon(status: TodoStatus): string {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '▶';
      case 'pending':
        return '○';
    }
  }

  private getStatusColor(status: TodoStatus): (text: string) => string {
    switch (status) {
      case 'completed':
        return chalk.green;
      case 'in_progress':
        return chalk.yellow;
      case 'pending':
        return chalk.gray;
    }
  }

    toJSON(): string {
    return JSON.stringify(this.todos, null, 2);
  }
}