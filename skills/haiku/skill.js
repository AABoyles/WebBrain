// Simple syllable counter: count vowel groups, apply common rules
function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  // Silent trailing e
  word = word.replace(/e$/, '');
  // Count vowel runs
  const groups = word.match(/[aeiouy]+/g) ?? [];
  return Math.max(1, groups.length);
}

function lineSyllables(line) {
  return line.trim().split(/\s+/).filter(Boolean).reduce((n, w) => n + syllables(w), 0);
}

export default {
  tag: 'haiku',
  instruction: `HAIKU CHECKER SKILL: To verify whether a poem follows the 5-7-5 haiku structure, call <|tool_call>call:haiku{input:<|"|>line1 / line2 / line3<|"|>}<tool_call|>. Separate lines with " / ".

Examples:
- "Is this a haiku?" → <|tool_call>call:haiku{input:<|"|>An old silent pond / A frog jumps into the pond / Splash silence again<|"|>}<tool_call|>`,
  call(content) {
    const lines = content.split('/').map(l => l.trim()).filter(Boolean);
    if (lines.length !== 3) return 'A haiku needs exactly 3 lines separated by " / ".';
    const counts = lines.map(lineSyllables);
    const target = [5, 7, 5];
    const report = lines.map((l, i) => `Line ${i+1}: "${l}" — ${counts[i]} syllable${counts[i]===1?'':'s'} (need ${target[i]})`);
    const valid = counts.every((c, i) => c === target[i]);
    return report.join('\n') + '\n\n' + (valid ? '✓ Valid haiku!' : '✗ Not a haiku (syllable counts must be 5-7-5).');
  },
  async handle() {},
};
