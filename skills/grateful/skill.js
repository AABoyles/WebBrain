import { getGratitude, addGratitude, deleteGratitude } from '../db.js';

export default {
  tag: 'grateful',
  instruction: `GRATITUDE LOG SKILL: To log something you're grateful for, call <|tool_call>call:grateful{input:<|"|>log:one-sentence entry<|"|>}<tool_call|>. To recall recent entries for reflection, call <|tool_call>call:grateful{input:<|"|>list<|"|>}<tool_call|>.

Examples:
- "I'm grateful for a good morning run" → <|tool_call>call:grateful{input:<|"|>log:Had a great morning run today.<|"|>}<tool_call|>
- "Show my gratitude log" → <|tool_call>call:grateful{input:<|"|>list<|"|>}<tool_call|>`,
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
