export default {
  tag: 'compound',
  instruction: `COMPOUND INTEREST SKILL: For compound interest calculations, call <|tool_call>call:compound{input:<|"|>principal at rate% for years [compounded n/year]<|"|>}<tool_call|>.

Examples:
- "1000 at 7% for 20 years" → <|tool_call>call:compound{input:<|"|>1000 at 7% for 20 years<|"|>}<tool_call|>
- "5000 at 5% for 10 years compounded 12" → <|tool_call>call:compound{input:<|"|>5000 at 5% for 10 years compounded 12<|"|>}<tool_call|>`,
  call(content) {
    const m = content.match(/([\d,.]+)\s+at\s+([\d.]+)%?\s+for\s+([\d.]+)\s+years?(?:\s+compounded\s+([\d.]+))?/i);
    if (!m) return 'Format: "1000 at 7% for 20 years" or add "compounded 12" for monthly.';

    const P  = parseFloat(m[1].replace(/,/g, ''));
    const r  = parseFloat(m[2]) / 100;
    const t  = parseFloat(m[3]);
    const n  = parseFloat(m[4] ?? '1');

    const A  = P * Math.pow(1 + r / n, n * t);
    const interest = A - P;
    const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      `Principal:     $${fmt(P)}`,
      `Rate:          ${(r * 100).toFixed(2)}% per year`,
      `Time:          ${t} year${t !== 1 ? 's' : ''}`,
      `Compounding:   ${n === 1 ? 'annually' : n === 12 ? 'monthly' : n === 365 ? 'daily' : `${n}×/year`}`,
      `Final amount:  $${fmt(A)}`,
      `Interest earned: $${fmt(interest)}`,
      `Return:        ${((interest / P) * 100).toFixed(2)}%`,
    ].join('\n');
  },
  async handle() {},
};
