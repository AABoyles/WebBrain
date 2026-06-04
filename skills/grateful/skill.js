import { getGratitude, addGratitude, deleteGratitude } from '../db.js';

export default {
  tag: 'grateful',
  instruction: `GRATITUDE LOG SKILL: To log something you're grateful for, emit <grateful>log:one-sentence entry</grateful>. To recall recent entries for reflection, emit <grateful>list</grateful>.

Examples:
- "I'm grateful for a good morning run" → <grateful>log:Had a great morning run today.</grateful>
- "Show my gratitude log" → <grateful>list</grateful>`,
  async call(content) {
    const cmd = content.trim();
    if (cmd === 'list') {
      const entries = await getGratitude();
      if (!entries.length) return 'No gratitude entries yet.';
      return entries.slice(-10).reverse().map(e => {
        const date = new Date(e.created).toLocaleDateString();
        return `[${e.id}] ${date}: ${e.text}`;
      }).join('\n');
    }
    if (cmd.startsWith('delete:')) {
      const id = parseInt(cmd.slice(7));
      await deleteGratitude(id);
      return `Entry ${id} deleted.`;
    }
    if (cmd.startsWith('log:')) {
      await addGratitude(cmd.slice(4).trim());
      return 'Gratitude logged.';
    }
    return 'Commands: log:text, list, delete:id';
  },
  async handle() {},
};
