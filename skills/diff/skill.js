// Myers diff algorithm (line-level)
function diff(a, b) {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const result = [];

  // Simple LCS-based diff
  const m = aLines.length, n = bLines.length;
  const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
  for (let i = m-1; i >= 0; i--)
    for (let j = n-1; j >= 0; j--)
      dp[i][j] = aLines[i] === bLines[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && aLines[i] === bLines[j]) {
      result.push(`  ${aLines[i]}`); i++; j++;
    } else if (j < n && (i >= m || dp[i+1][j] >= dp[i][j+1])) {
      result.push(`+ ${bLines[j]}`); j++;
    } else {
      result.push(`- ${aLines[i]}`); i++;
    }
  }
  return result.join('\n');
}

export default {
  tag: 'diff',
  instruction: `DIFF SKILL: To show a line-level diff between two texts, emit <diff>text A|||text B</diff> (three pipes as separator).

Example: <diff>hello\nworld|||hello\nearth</diff>`,
  call(content) {
    const sep = content.indexOf('|||');
    if (sep === -1) return 'Format: textA|||textB';
    const a = content.slice(0, sep);
    const b = content.slice(sep + 3);
    const result = diff(a, b);
    const added   = (result.match(/^\+/gm) ?? []).length;
    const removed = (result.match(/^-/gm) ?? []).length;
    return `+${added} -${removed}\n${result}`;
  },
  async handle() {},
};
