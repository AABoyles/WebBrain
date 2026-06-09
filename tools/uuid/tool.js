export default {
  tag: 'uuid',
  instruction: `UUID GENERATOR SKILL: To generate one or more random UUIDs (v4), call <|tool_call>call:uuid{input:<|"|>count<|"|>}<tool_call|> or just <|tool_call>call:uuid{input:<|"|>1<|"|>}<tool_call|>.

Examples:
- "Generate a UUID" → <|tool_call>call:uuid{input:<|"|>1<|"|>}<tool_call|>
- "Give me 5 UUIDs" → <|tool_call>call:uuid{input:<|"|>5<|"|>}<tool_call|>`,
  call(content) {
    const n = Math.min(Math.max(parseInt(content.trim()) || 1, 1), 20);
    return Array.from({ length: n }, () => crypto.randomUUID()).join('\n');
  },
  async handle() {},
};
