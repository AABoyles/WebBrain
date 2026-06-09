export default {
  tag: 'caesar',
  instruction: `CAESAR CIPHER SKILL: To apply a Caesar shift cipher, call <|tool_call>call:caesar{input:<|"|>shift:text<|"|>}<tool_call|>. Use a negative shift to decode.

Examples:
- "Encode 'Hello' with shift 3" → <|tool_call>call:caesar{input:<|"|>3:Hello<|"|>}<tool_call|>
- "Decode 'Khoor' (shift 3)" → <|tool_call>call:caesar{input:<|"|>-3:Khoor<|"|>}<tool_call|>
- "ROT13 is shift 13" → <|tool_call>call:caesar{input:<|"|>13:text<|"|>}<tool_call|>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon === -1) return 'Format: shift:text — e.g. 3:Hello';
    const shift = parseInt(content.slice(0, colon).trim(), 10);
    if (isNaN(shift)) return 'Shift must be an integer.';
    const text = content.slice(colon + 1);
    const s = ((shift % 26) + 26) % 26;
    return text.replace(/[a-zA-Z]/g, c => {
      const base = c < 'a' ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - base + s) % 26 + base);
    });
  },
  async handle() {},
};
