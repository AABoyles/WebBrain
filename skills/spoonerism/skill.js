function initialConsonants(word) {
  const m = word.match(/^([^aeiou]*)(.+)/i);
  return m ? [m[1], m[2]] : ['', word];
}

export default {
  tag: 'spoonerism',
  instruction: `SPOONERISM SKILL: To swap the initial consonant clusters of adjacent words, emit <spoonerism>phrase</spoonerism>.

Examples:
- "Spoonerism of 'black bird'" → <spoonerism>black bird</spoonerism>
- "Spoonerize 'crushing blow'" → <spoonerism>crushing blow</spoonerism>`,
  call(text) {
    const words = text.trim().split(/\s+/);
    if (words.length < 2) return 'Need at least two words.';
    const result = [];
    for (let i = 0; i < words.length - 1; i += 2) {
      const [c1, r1] = initialConsonants(words[i].toLowerCase());
      const [c2, r2] = initialConsonants(words[i+1].toLowerCase());
      result.push(c2 + r1, c1 + r2);
    }
    if (words.length % 2 === 1) result.push(words[words.length - 1]);
    return result.join(' ');
  },
  async handle() {},
};
