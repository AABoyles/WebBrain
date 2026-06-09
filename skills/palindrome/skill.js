export default {
  tag: 'palindrome',
  instruction: `PALINDROME CHECKER SKILL: To check if a word or phrase is a palindrome (ignoring spaces and punctuation), call <|tool_call>call:palindrome{input:<|"|>text<|"|>}<tool_call|>.

Examples:
- "Is 'racecar' a palindrome?" → <|tool_call>call:palindrome{input:<|"|>racecar<|"|>}<tool_call|>
- "Check: A man a plan a canal Panama" → <|tool_call>call:palindrome{input:<|"|>A man a plan a canal Panama<|"|>}<tool_call|>`,
  call(text) {
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g,'');
    const rev   = clean.split('').reverse().join('');
    const is    = clean === rev;
    return is ? `✓ "${text}" is a palindrome.` : `✗ "${text}" is not a palindrome.\n  Cleaned: ${clean}\n  Reversed: ${rev}`;
  },
  async handle() {},
};
