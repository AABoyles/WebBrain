export default {
  tag: 'atbash',
  instruction: `ATBASH CIPHER SKILL: To apply the Atbash mirror cipher (A↔Z, B↔Y, etc.), emit <atbash>text</atbash>. It's self-inverse — same operation encodes and decodes.

Example: <atbash>Hello World</atbash> → Svool Dliow`,
  call: text => text.replace(/[a-zA-Z]/g, c => {
    const base = c < 'a' ? 65 : 97;
    return String.fromCharCode(25 - (c.charCodeAt(0) - base) + base);
  }),
  async handle() {},
};
