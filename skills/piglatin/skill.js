const VOWELS = new Set('aeiouAEIOU');

function pigWord(word) {
  if (!word) return word;
  // Preserve leading non-alpha (punctuation)
  const m = word.match(/^([^a-zA-Z]*)([a-zA-Z]*)([^a-zA-Z]*)$/);
  if (!m) return word;
  const [, pre, alpha, suf] = m;
  if (!alpha) return word;

  const upper = alpha[0] === alpha[0].toUpperCase() && alpha[0] !== alpha[0].toLowerCase();

  if (VOWELS.has(alpha[0])) {
    const result = alpha + 'way';
    return pre + (upper ? result[0].toUpperCase() + result.slice(1).toLowerCase() : result) + suf;
  }

  // Find first vowel cluster
  let i = 1;
  while (i < alpha.length && !VOWELS.has(alpha[i])) i++;
  const onset = alpha.slice(0, i);
  const rest  = alpha.slice(i);
  const result = rest + onset + 'ay';
  return pre + (upper ? result[0].toUpperCase() + result.slice(1).toLowerCase() : result) + suf;
}

export default {
  tag: 'piglatin',
  instruction: `PIG LATIN SKILL: To translate text to Pig Latin, emit <piglatin>text</piglatin>.

Examples:
- "Say 'hello world' in Pig Latin" → <piglatin>hello world</piglatin>
- "Pig Latin for 'first'" → <piglatin>first</piglatin>`,
  call: text => text.split(/\b/).map(pigWord).join(''),
  async handle() {},
};
