const TO_R = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
const FROM_R = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };

function toRoman(n) {
  if (n < 1 || n > 3999) return 'Out of range (1–3999).';
  let result = '';
  for (const [val, sym] of TO_R) { while (n >= val) { result += sym; n -= val; } }
  return result;
}

function fromRoman(s) {
  s = s.toUpperCase().trim();
  if (!/^[IVXLCDM]+$/.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur  = FROM_R[s[i]];
    const next = FROM_R[s[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

export default {
  tag: 'roman',
  instruction: `ROMAN NUMERAL SKILL: To convert to or from Roman numerals, emit <roman>value</roman>. Integers 1–3999 convert to Roman; Roman strings convert to integers.

Examples:
- "2024 in Roman numerals" → <roman>2024</roman>
- "What is MMXXIV?" → <roman>MMXXIV</roman>`,
  call(content) {
    content = content.trim();
    const n = parseInt(content, 10);
    if (!isNaN(n) && String(n) === content) return toRoman(n);
    const from = fromRoman(content);
    return from !== null ? String(from) : 'Enter an integer (1–3999) or a Roman numeral string.';
  },
  async handle() {},
};
