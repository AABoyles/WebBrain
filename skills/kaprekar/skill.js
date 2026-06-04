export default {
  tag: 'kaprekar',
  instruction: `KAPREKAR ROUTINE SKILL: To apply the Kaprekar routine to a 4-digit number (always reaches 6174), emit <kaprekar>number</kaprekar>.

Examples:
- "Kaprekar routine on 1234" → <kaprekar>1234</kaprekar>
- "Apply Kaprekar to 3524" → <kaprekar>3524</kaprekar>`,
  call(content) {
    let n = parseInt(content.trim().replace(/,/g,''));
    if (isNaN(n) || n < 0 || n > 9999) return 'Enter a 4-digit number (0000–9999).';
    const digits = String(n).padStart(4,'0').split('').map(Number);
    if (new Set(digits).size === 1) return `${String(n).padStart(4,'0')}: All digits the same — Kaprekar routine is undefined.`;
    const steps = [];
    let current = n;
    for (let i = 0; i < 8; i++) {
      const d = String(current).padStart(4,'0').split('').map(Number).sort((a,b)=>a-b);
      const asc  = parseInt(d.join(''));
      const desc = parseInt([...d].reverse().join(''));
      const next = desc - asc;
      steps.push(`${String(desc).padStart(4,'0')} − ${String(asc).padStart(4,'0')} = ${String(next).padStart(4,'0')}`);
      current = next;
      if (current === 6174) break;
    }
    return `Starting from ${String(n).padStart(4,'0')}:\n${steps.join('\n')}\n→ Reached Kaprekar constant 6174 in ${steps.length} step${steps.length!==1?'s':''}`;
  },
  async handle() {},
};
