export default {
  tag: 'palindrome',
  instruction: `PALINDROME CHECKER SKILL: To check if a word or phrase is a palindrome (ignoring spaces and punctuation), emit <palindrome>text</palindrome>.

Examples:
- "Is 'racecar' a palindrome?" → <palindrome>racecar</palindrome>
- "Check: A man a plan a canal Panama" → <palindrome>A man a plan a canal Panama</palindrome>`,
  call(text) {
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g,'');
    const rev   = clean.split('').reverse().join('');
    const is    = clean === rev;
    return is ? `✓ "${text}" is a palindrome.` : `✗ "${text}" is not a palindrome.\n  Cleaned: ${clean}\n  Reversed: ${rev}`;
  },
  async handle() {},
};
