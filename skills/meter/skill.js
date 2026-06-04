// Syllable counter (same heuristic as haiku skill)
function syllableCount(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  word = word.replace(/e$/, '');
  return Math.max(1, (word.match(/[aeiouy]+/g) ?? []).length);
}

// Stress pattern: unstressed (u) vs stressed (/)
// Simple heuristic: stressed if more syllables or word is "content word"
const FUNCTION_WORDS = new Set([
  'a','an','the','and','but','or','nor','for','yet','so','in','on','at','to','of','by',
  'as','is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','shall','should','may','might','can','could','must','not','no',
  'i','me','my','you','your','he','him','his','she','her','it','its','we','us','our','they','them','their',
]);

function stressWord(word, syl) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (syl === 1) return FUNCTION_WORDS.has(clean) ? 'u' : '/';
  // Multi-syllable: alternate, stress on first for nouns/verbs
  return Array.from({length: syl}, (_, i) => i === 0 ? '/' : 'u');
}

function identifyFeet(pattern) {
  // pattern: array of 'u' and '/'
  const s = pattern.join('');
  const counts = { iambic:0, trochaic:0, anapestic:0, dactylic:0 };
  // Count each foot type (2 or 3 syllables)
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] === 'u' && s[i+1] === '/') counts.iambic++;
    if (s[i] === '/' && s[i+1] === 'u') counts.trochaic++;
  }
  for (let i = 0; i < s.length - 2; i++) {
    if (s[i] === 'u' && s[i+1] === 'u' && s[i+2] === '/') counts.anapestic++;
    if (s[i] === '/' && s[i+1] === 'u' && s[i+2] === 'u') counts.dactylic++;
  }
  const dominant = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  return dominant[1] > 0 ? dominant[0] : 'mixed';
}

export default {
  tag: 'meter',
  instruction: `METER CHECKER SKILL: To analyze the metrical pattern of a line of poetry, emit <meter>line of poetry</meter>.

Examples:
- "Scan 'Shall I compare thee to a summer's day'" → <meter>Shall I compare thee to a summer's day</meter>
- "Meter of 'To be or not to be'" → <meter>To be or not to be</meter>`,
  call(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const pattern = [];
    const marked  = [];
    for (const word of words) {
      const syl = syllableCount(word);
      const stress = stressWord(word, syl);
      const marks = typeof stress === 'string' ? [stress] : stress;
      pattern.push(...marks);
      marked.push(`${word}(${marks.join('')})`);
    }
    const totalSyl  = pattern.length;
    const foot      = identifyFeet(pattern);
    const patStr    = pattern.join('');
    const feetCount = Math.round(totalSyl / (foot === 'iambic' || foot === 'trochaic' ? 2 : 3));
    const names     = {iambic:'iambic',trochaic:'trochaic',anapestic:'anapestic',dactylic:'dactylic',mixed:'mixed'};
    const lineNames  = {2:'dimeter',3:'trimeter',4:'tetrameter',5:'pentameter',6:'hexameter',7:'heptameter',8:'octameter'};
    const lineName   = lineNames[feetCount] ? `${names[foot]} ${lineNames[feetCount]}` : `${names[foot]} (${feetCount} feet)`;
    return [`${patStr}  (${totalSyl} syllables)`,`Pattern: ${marked.join(' ')}`,`Meter: ${lineName} (approximate)`].join('\n');
  },
  async handle() {},
};
