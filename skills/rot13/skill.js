export default {
  tag: 'rot13',
  instruction: `ROT13 SKILL: To apply ROT13 (or to decode it, since it's self-inverse), emit <rot13>text</rot13>.

Examples:
- "ROT13 'Hello, World!'" → <rot13>Hello, World!</rot13>
- "Decode this: Uryyb" → <rot13>Uryyb</rot13>`,
  call: text => text.replace(/[a-zA-Z]/g, c => {
    const base = c < 'a' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  }),
  async handle() {},
};
