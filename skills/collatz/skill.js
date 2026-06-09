export default {
  tag: 'collatz',
  instruction: `COLLATZ SEQUENCE SKILL: To run the Collatz (3n+1) sequence from any positive integer, call <|tool_call>call:collatz{input:<|"|>n<|"|>}<tool_call|>. Shows steps to reach 1.

Examples:
- "Collatz sequence for 27" → <|tool_call>call:collatz{input:<|"|>27<|"|>}<tool_call|>
- "How many steps for 6?" → <|tool_call>call:collatz{input:<|"|>6<|"|>}<tool_call|>`,
  call(content) {
    let n = parseInt(content.trim());
    if (isNaN(n) || n < 1) return 'Enter a positive integer.';
    if (n > 1e12) return 'Number too large (max 10¹²).';
    const seq = [n];
    while (n !== 1 && seq.length < 1000) {
      n = n % 2 === 0 ? n / 2 : 3 * n + 1;
      seq.push(n);
    }
    const steps = seq.length - 1;
    const max   = Math.max(...seq);
    const show  = seq.length <= 30 ? seq.join(' → ') : seq.slice(0,15).join(' → ') + ' … ' + seq.slice(-5).join(' → ');
    return [`${seq[0]} reaches 1 in ${steps} step${steps !== 1 ? 's' : ''}`,`Peak value: ${max}`,show].join('\n');
  },
  async handle() {},
};
