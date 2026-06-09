export default {
  tag: 'stats',
  instruction: `STATISTICS SKILL: For descriptive stats on a list of numbers, call <|tool_call>call:stats{input:<|"|>n1, n2, n3, …<|"|>}<tool_call|>.

Examples:
- "Stats on 4, 8, 15, 16, 23, 42" → <|tool_call>call:stats{input:<|"|>4, 8, 15, 16, 23, 42<|"|>}<tool_call|>
- "Mean and std dev of 1 2 3 4 5" → <|tool_call>call:stats{input:<|"|>1, 2, 3, 4, 5<|"|>}<tool_call|>`,
  call(content) {
    const nums = content.split(/[\s,;]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length < 2) return 'Need at least 2 numbers.';

    const n    = nums.length;
    const sum  = nums.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const sorted = [...nums].sort((a, b) => a - b);
    const mid    = Math.floor(n / 2);
    const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    const freq = {};
    nums.forEach(v => freq[v] = (freq[v] ?? 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    const modes   = Object.entries(freq).filter(([,f]) => f === maxFreq).map(([v]) => +v);
    const modeStr = maxFreq > 1 ? modes.join(', ') : 'none (all unique)';

    const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const sd       = Math.sqrt(variance);

    return [
      `n:      ${n}`,
      `min:    ${sorted[0]}`,
      `max:    ${sorted[n - 1]}`,
      `range:  ${sorted[n - 1] - sorted[0]}`,
      `sum:    ${sum}`,
      `mean:   ${mean.toPrecision(6)}`,
      `median: ${median}`,
      `mode:   ${modeStr}`,
      `std dev: ${sd.toPrecision(6)}`,
      `variance: ${variance.toPrecision(6)}`,
    ].join('\n');
  },
  async handle() {},
};
