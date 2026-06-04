function getFibs(max) {
  const f = [1, 2];
  while (f[f.length-1] < max) f.push(f[f.length-1] + f[f.length-2]);
  return f;
}

export default {
  tag: 'zeckendorf',
  instruction: `ZECKENDORF REPRESENTATION SKILL: To express a positive integer as a sum of non-consecutive Fibonacci numbers (Zeckendorf's theorem), emit <zeckendorf>n</zeckendorf>.

Examples:
- "Zeckendorf of 100" → <zeckendorf>100</zeckendorf>
- "Express 64 as Fibonacci sum" → <zeckendorf>64</zeckendorf>`,
  call(content) {
    let n = parseInt(content.trim().replace(/,/g,''));
    if (isNaN(n) || n < 1) return 'Enter a positive integer.';
    if (n > 1e12) return 'Number too large (max 10¹²).';
    const orig = n;
    const fibs = getFibs(n).filter(f => f <= n).sort((a,b) => b-a);
    const parts = [];
    for (const f of fibs) {
      if (f <= n) { parts.push(f); n -= f; }
    }
    return `${orig} = ${parts.join(' + ')}  (Fibonacci: ${parts.join(', ')})`;
  },
  async handle() {},
};
