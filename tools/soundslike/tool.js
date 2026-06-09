// Soundex algorithm
function soundex(s) {
  s = s.toUpperCase().replace(/[^A-Z]/g,'');
  if (!s) return '';
  const MAP = {A:0,E:0,I:0,O:0,U:0,H:0,W:0,Y:0,B:1,F:1,P:1,V:1,C:2,G:2,J:2,K:2,Q:2,S:2,X:2,Z:2,D:3,T:3,L:4,M:5,N:5,R:6};
  const first = s[0];
  let code = first;
  let prev = MAP[first];
  for (let i = 1; i < s.length && code.length < 4; i++) {
    const n = MAP[s[i]] ?? 0;
    if (n && n !== prev) { code += n; }
    if (n !== 0) prev = n;
  }
  return code.padEnd(4,'0');
}

// Dice coefficient (bigram overlap) — textual similarity, not phonetic
function dice(a, b) {
  a = a.toLowerCase().replace(/\s+/g, '');
  b = b.toLowerCase().replace(/\s+/g, '');
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const bg = s.slice(i, i+2); m.set(bg, (m.get(bg) ?? 0) + 1); } return m; };
  const ma = bigrams(a), mb = bigrams(b);
  let inter = 0;
  for (const [bg, n] of ma) inter += Math.min(n, mb.get(bg) ?? 0);
  return (2 * inter) / (a.length - 1 + b.length - 1);
}

// Jaro-Winkler similarity
function jaroWinkler(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  const len1 = a.length, len2 = b.length;
  const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
  const matched1 = new Uint8Array(len1), matched2 = new Uint8Array(len2);
  let matches = 0, transpositions = 0;
  for (let i = 0; i < len1; i++) {
    const lo = Math.max(0, i - matchDist), hi = Math.min(i + matchDist, len2 - 1);
    for (let j = lo; j <= hi; j++) {
      if (matched2[j] || a[i] !== b[j]) continue;
      matched1[i] = matched2[j] = 1; matches++; break;
    }
  }
  if (!matches) return 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!matched1[i]) continue;
    while (!matched2[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, len1, len2); i++) { if (a[i] === b[i]) prefix++; else break; }
  return jaro + prefix * 0.1 * (1 - jaro);
}

export default {
  tag: 'soundslike',
  instruction: `PHONETIC SIMILARITY SKILL: To compare two strings, call <|tool_call>call:soundslike{input:<|"|>word1 word2<|"|>}<tool_call|>.
Returns Soundex (phonetic), Dice coefficient (textual bigrams), and Jaro-Winkler similarity.

Examples:
- "Do Smith and Smythe sound alike?" → <|tool_call>call:soundslike{input:<|"|>Smith Smythe<|"|>}<tool_call|>
- "Similarity of 'colour' and 'color'" → <|tool_call>call:soundslike{input:<|"|>colour color<|"|>}<tool_call|>`,
  call(content) {
    const parts = content.trim().split(/\s+/);
    if (parts.length < 2) return 'Provide two words.';
    const [a, b] = parts;
    const sa = soundex(a), sb = soundex(b);
    const d  = dice(a, b);
    const jw = jaroWinkler(a, b);
    return [
      `Soundex:       "${a}" = ${sa}  |  "${b}" = ${sb}  →  ${sa === sb ? '✓ phonetically similar' : '✗ phonetically distinct'}`,
      `Dice:          ${(d * 100).toFixed(1)}% textual similarity (bigrams)`,
      `Jaro-Winkler:  ${(jw * 100).toFixed(1)}% similarity`,
    ].join('\n');
  },
  async handle() {},
};
