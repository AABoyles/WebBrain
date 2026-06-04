export default {
  tag: 'pangram',
  instruction: `PANGRAM CHECKER SKILL: To check if a sentence uses all 26 letters of the alphabet, emit <pangram>text</pangram>.

Example: <pangram>The quick brown fox jumps over the lazy dog</pangram>`,
  call(text) {
    const used    = new Set(text.toLowerCase().replace(/[^a-z]/g,'').split(''));
    const missing = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !used.has(c));
    if (!missing.length) return `✓ Pangram! Uses all 26 letters.`;
    return `✗ Not a pangram. Missing ${missing.length} letter${missing.length !== 1 ? 's' : ''}: ${missing.join(', ')}`;
  },
  async handle() {},
};
