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

export default {
  tag: 'soundslike',
  instruction: `PHONETIC SIMILARITY SKILL: To check if two words sound similar (Soundex algorithm), emit <soundslike>word1 word2</soundslike>.

Examples:
- "Do Smith and Smythe sound alike?" → <soundslike>Smith Smythe</soundslike>
- "Phonetic similarity of colour and color" → <soundslike>colour color</soundslike>`,
  call(content) {
    const parts = content.trim().split(/\s+/);
    if (parts.length < 2) return 'Provide two words.';
    const [a, b] = parts;
    const sa = soundex(a);
    const sb = soundex(b);
    const match = sa === sb;
    return [`Soundex "${a}": ${sa}`,`Soundex "${b}": ${sb}`,match ? '✓ Phonetically similar (same Soundex code).' : '✗ Phonetically distinct (different Soundex codes).'].join('\n');
  },
  async handle() {},
};
