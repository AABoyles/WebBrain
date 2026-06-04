function blend(a, b) {
  // Try to find a vowel-group overlap point
  a = a.toLowerCase();
  b = b.toLowerCase();
  // Find where a's end overlaps with b's beginning
  const results = [];
  for (let i = Math.floor(a.length * 0.4); i <= Math.floor(a.length * 0.75); i++) {
    const tail = a.slice(i);
    const idx  = b.indexOf(tail[0]);
    if (idx > 0 && idx < b.length * 0.5) results.push(a.slice(0, i) + b.slice(idx));
  }
  if (results.length) return [...new Set(results)].slice(0,3);
  // Fallback: simple midpoint blend
  return [a.slice(0, Math.ceil(a.length/2)) + b.slice(Math.floor(b.length/2))];
}

export default {
  tag: 'portmanteau',
  instruction: `PORTMANTEAU BUILDER SKILL: To blend two words into a portmanteau, emit <portmanteau>word1 word2</portmanteau>.

Examples:
- "Blend 'brunch' etymology (breakfast + lunch)" → <portmanteau>breakfast lunch</portmanteau>
- "Make a portmanteau of smoke and fog" → <portmanteau>smoke fog</portmanteau>`,
  call(content) {
    const parts = content.trim().split(/\s+/);
    if (parts.length < 2) return 'Provide two words.';
    const [a, b] = parts;
    const blends = blend(a, b);
    return `${a} + ${b} →\n${blends.map(w => `  ${w}`).join('\n')}`;
  },
  async handle() {},
};
