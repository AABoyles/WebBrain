import { getTodos, addTodo, setTodoDone, deleteTodo } from '../db.js';

export default {
  tag: 'todo',
  instruction: `TODO SKILL: Manage tasks with <todo>command</todo>. Commands: list, add:text, done:ID, delete:ID.

Examples:
- "Show my todos" → <todo>list</todo>
- "Add 'buy milk'" → <todo>add:Buy milk</todo>
- "Mark task 3 done" → <todo>done:3</todo>`,
  async call(content) {
    const cmd = content.trim();
    if (cmd === 'list') {
      const open = (await getTodos()).filter(t => !t.done);
      return open.length ? open.map(t => `#${t.id}: ${t.text}`).join('\n') : 'No open tasks.';
    }
    if (cmd.startsWith('add:')) {
      const text = cmd.slice(4).trim();
      if (!text) return 'No task text provided.';
      const id = await addTodo(text);
      return `Added task #${id}: "${text}"`;
    }
    if (cmd.startsWith('done:')) {
      const id = parseInt(cmd.slice(5));
      await setTodoDone(id, true);
      return `Marked #${id} done.`;
    }
    if (cmd.startsWith('delete:')) {
      const id = parseInt(cmd.slice(7));
      await deleteTodo(id);
      return `Deleted task #${id}.`;
    }
    return 'Commands: list, add:text, done:ID, delete:ID';
  },
  async handle() {},
};
