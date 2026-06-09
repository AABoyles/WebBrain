export default {
  tag: 'atbash',
  instruction: `ATBASH CIPHER SKILL: To apply the Atbash mirror cipher (A↔Z, B↔Y, etc.), call <|tool_call>call:atbash{input:<|"|>text<|"|>}<tool_call|>. It's self-inverse — same operation encodes and decodes.

Example: <|tool_call>call:atbash{input:<|"|>Hello World<|"|>}<tool_call|> → Svool Dliow`,
  call: text => text.replace(/[a-zA-Z]/g, c => {
    const base = c < 'a' ? 65 : 97;
    return String.fromCharCode(25 - (c.charCodeAt(0) - base) + base);
  }),
  async handle() {},
};
