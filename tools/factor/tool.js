function primeFactors(n) {
  const factors = [];
  for (let d = 2; d * d <= n; d++) {
    while (n % d === 0) { factors.push(d); n = Math.floor(n / d); }
  }
  if (n > 1) factors.push(n);
  return factors;
}

export default {
  tag: 'factor',
  instruction: `PRIME FACTORIZER SKILL: To find the prime factorization of an integer, call <|tool_call>call:factor{input:<|"|>number<|"|>}<tool_call|>.

Examples:
- "Prime factors of 360" → <|tool_call>call:factor{input:<|"|>360<|"|>}<tool_call|>
- "Factor 1001" → <|tool_call>call:factor{input:<|"|>1001<|"|>}<tool_call|>`,
  call(content) {
    const n = parseInt(content.trim().replace(/,/g, ''), 10);
    if (isNaN(n) || n < 2) return 'Enter an integer ≥ 2.';
    if (n > 1e12) return 'Number too large (max 1 trillion).';
    const factors = primeFactors(n);
    if (factors.length === 1) return `${n} is prime.`;
    // Group and show exponents
    const exp = {};
    for (const f of factors) exp[f] = (exp[f] ?? 0) + 1;
    const expr = Object.entries(exp).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ');
    return `${n} = ${expr}`;
  },
  async handle() {},
};
