export default {
  tag: 'sternbrocot',
  instruction: `STERN-BROCOT TREE SKILL: To find the path to a fraction in the Stern-Brocot tree, call <|tool_call>call:sternbrocot{input:<|"|>p/q<|"|>}<tool_call|>.

Examples:
- "Path to 3/7 in Stern-Brocot tree" → <|tool_call>call:sternbrocot{input:<|"|>3/7<|"|>}<tool_call|>
- "Stern-Brocot for 5/8" → <|tool_call>call:sternbrocot{input:<|"|>5/8<|"|>}<tool_call|>`,
  call(content) {
    const m = content.trim().match(/^(\d+)\/(\d+)$/);
    if (!m) return 'Format: p/q (e.g. 3/7). Must be a proper fraction.';
    let p = parseInt(m[1]), q = parseInt(m[2]);
    if (p <= 0 || q <= 0) return 'Both numerator and denominator must be positive.';
    if (p >= q) return 'Enter a proper fraction (p < q).';

    // Reduce
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const g = gcd(p, q);
    if (g > 1) { p /= g; q /= g; }

    const path = [];
    let lp = 0, lq = 1, rp = 1, rq = 0; // left = 0/1, right = 1/0 (infinity)
    for (let i = 0; i < 50; i++) {
      const mp = lp + rp, mq = lq + rq;
      if (p * mq === q * mp) { path.push(`${mp}/${mq}`); break; }
      if (p * mq < q * mp) { path.push('L'); rp = mp; rq = mq; }
      else                 { path.push('R'); lp = mp; lq = mq; }
    }

    return [`Path to ${p}/${q} in the Stern-Brocot tree:`,path.join(' → ')].join('\n');
  },
  async handle() {},
};
