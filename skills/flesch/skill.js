function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  word = word.replace(/e$/, '');
  const groups = word.match(/[aeiouy]+/g) ?? [];
  return Math.max(1, groups.length);
}

function grade(score) {
  if (score >= 90) return '5th grade (very easy)';
  if (score >= 80) return '6th grade (easy)';
  if (score >= 70) return '7th grade (fairly easy)';
  if (score >= 60) return '8th–9th grade (standard)';
  if (score >= 50) return '10th–12th grade (fairly difficult)';
  if (score >= 30) return 'College (difficult)';
  return 'Professional (very difficult)';
}

export default {
  tag: 'flesch',
  instruction: `READABILITY SKILL: To score the reading ease of a passage, emit <flesch>text to analyze</flesch>. Returns the Flesch Reading Ease score (100=simplest, 0=hardest).

Example: <flesch>The quick brown fox jumps over the lazy dog.</flesch>`,
  call(text) {
    const words     = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const W  = words.length;
    const S  = sentences.length;
    const Y  = words.reduce((n, w) => n + syllables(w), 0);
    if (!W || !S) return 'Not enough text to analyze.';
    const score = 206.835 - 1.015 * (W / S) - 84.6 * (Y / W);
    const clamped = Math.max(0, Math.min(100, score));
    return [
      `Flesch Reading Ease: ${clamped.toFixed(1)}`,
      `Grade level: ${grade(clamped)}`,
      `Stats: ${W} words, ${S} sentences, ${Y} syllables`,
      `Avg sentence length: ${(W / S).toFixed(1)} words`,
      `Avg syllables/word: ${(Y / W).toFixed(2)}`,
    ].join('\n');
  },
  async handle() {},
};
