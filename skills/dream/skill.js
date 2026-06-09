import { getDreams, addDream, deleteDream } from '../db.js';

export default {
  tag: 'dream',
  instruction: `DREAM LOG SKILL: To record a dream, call <|tool_call>call:dream{input:<|"|>log:description<|"|>}<tool_call|>. To recall recent dreams, call <|tool_call>call:dream{input:<|"|>list<|"|>}<tool_call|>. To delete, call <|tool_call>call:dream{input:<|"|>delete:id<|"|>}<tool_call|>.

Examples:
- "Log last night's dream" → <|tool_call>call:dream{input:<|"|>log:I was flying over a city made of glass...<|"|>}<tool_call|>
- "What dreams have I recorded?" → <|tool_call>call:dream{input:<|"|>list<|"|>}<tool_call|>`,
  async call(content) {
    const cmd = content.trim();
    if (cmd === 'list') {
      const dreams = await getDreams();
      if (!dreams.length) return 'No dreams logged yet.';
      return dreams.slice(-10).reverse().map(d => {
        const date = new Date(d.created).toLocaleDateString();
        return `[${d.id}] ${date}: ${d.text}`;
      }).join('\n');
    }
    if (cmd.startsWith('delete:')) {
      const id = parseInt(cmd.slice(7));
      await deleteDream(id);
      return `Dream ${id} deleted.`;
    }
    if (cmd.startsWith('log:')) {
      await addDream(cmd.slice(4).trim());
      return 'Dream logged.';
    }
    return 'Commands: log:description, list, delete:id';
  },
  async handle() {},
};
