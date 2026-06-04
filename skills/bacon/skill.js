// Francis Bacon's biliteral cipher — each letter encoded as 5 A/B symbols
const CODES = 'AAAAA AAAAB AAABA AAABB AABAA AABAB AABBA AABBB ABAAA ABAAB ABABA ABABB ABBAA ABBAB ABBBA ABBBB BAAAA BAAAB BAABA BAABB BABAA BABAB BABBA BABBB BAAAA BBAAB BBABA BBABB BBBAA BBBAB BBBBA'.split(' ');
// I=J and U=V share codes in the original; we use a 24-letter variant
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TO_CODE  = Object.fromEntries(LETTERS.split('').map((c,i) => [c, CODES[i]]));
const FROM_CODE = Object.fromEntries(CODES.map((c,i) => [c, LETTERS[i]]));

export default {
  tag: 'bacon',
  instruction: `BACONIAN CIPHER SKILL: To encode text with Francis Bacon's biliteral cipher or decode it, emit <bacon>text</bacon> or <bacon>decode:AAAAB AAABB...</bacon>.

Examples:
- "Encode 'HELLO' in Bacon cipher" → <bacon>HELLO</bacon>
- "Decode Baconian: AABBB AABAA ABABB ABABB ABBBA" → <bacon>decode:AABBB AABAA ABABB ABABB ABBBA</bacon>`,
  call(content) {
    if (/^decode:/i.test(content)) {
      const groups = content.slice(7).trim().toUpperCase().split(/\s+/);
      return groups.map(g => FROM_CODE[g] ?? '?').join('');
    }
    return content.toUpperCase().replace(/[^A-Z ]/g, '').split('').map(c => {
      if (c === ' ') return '/';
      return TO_CODE[c] ?? c;
    }).join(' ');
  },
  async handle() {},
};
