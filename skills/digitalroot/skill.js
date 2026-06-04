export default {
  tag: 'digitalroot',
  instruction: `DIGITAL ROOT SKILL: To compute the digital root (iterative digit sum) of a number, emit <digitalroot>n</digitalroot>.

Examples:
- "Digital root of 9875" → <digitalroot>9875</digitalroot>
- "Casting out nines for 12345" → <digitalroot>12345</digitalroot>`,
  call(content) {
    const n = content.trim().replace(/,/g,'');
    if (!/^\d+$/.test(n)) return 'Enter a positive integer.';
    const steps = [];
    let current = n;
    while (current.length > 1) {
      const sum = current.split('').reduce((a,d) => a + parseInt(d), 0);
      steps.push(`${current} → ${sum}`);
      current = String(sum);
    }
    const root = parseInt(current);
    // Additive persistence
    return [`Digital root: ${root}`,`Steps (${steps.length}): ${steps.join(' → ')}`,`Congruence class mod 9: ${root === 9 ? 0 : root} (divisible by 9? ${root === 9 ? 'yes' : 'no'})`].join('\n');
  },
  async handle() {},
};
