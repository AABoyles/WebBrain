export default {
  tag: 'rot13',
  instruction: `ROT13 SKILL: To apply ROT13 (or to decode it, since it's self-inverse), call <|tool_call>call:rot13{input:<|"|>text<|"|>}<tool_call|>.

Examples:
- "ROT13 'Hello, World!'" → <|tool_call>call:rot13{input:<|"|>Hello, World!<|"|>}<tool_call|>
- "Decode this: Uryyb" → <|tool_call>call:rot13{input:<|"|>Uryyb<|"|>}<tool_call|>`,
  call: text => text.replace(/[a-zA-Z]/g, c => {
    const base = c < 'a' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  }),
  async handle() {},
};
