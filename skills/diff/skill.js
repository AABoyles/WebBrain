// LCS-based diff for arbitrary token arrays
function lcsTokens(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);

  const result = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) { result.push({ type: ' ', val: a[i] }); i++; j++; }
    else if (j < n && (i >= m || dp[i+1][j] >= dp[i][j+1])) { result.push({ type: '+', val: b[j] }); j++; }
    else { result.push({ type: '-', val: a[i] }); i++; }
  }
  return result;
}

function lineDiff(a, b) {
  const ops = lcsTokens(a.split('\n'), b.split('\n'));
  return ops.map(o => `${o.type} ${o.val}`).join('\n');
}

function wordDiff(a, b) {
  const ops = lcsTokens(a.match(/\S+|\s+/g) ?? [], b.match(/\S+|\s+/g) ?? []);
  return ops.map(o => o.type === ' ' ? o.val : o.type === '+' ? `{+${o.val}+}` : `[-${o.val}-]`).join('');
}

// Levenshtein edit distance (DP, O(m*n))
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const row = Array.from({length: n + 1}, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i-1] === b[j-1] ? row[j-1] : 1 + Math.min(prev, row[j], row[j-1]);
      row[j-1] = prev;
      prev = val;
    }
    row[n] = prev;
  }
  return row[n];
}

export default {
  tag: 'diff',
  instruction: `DIFF SKILL: To compare two texts, emit <diff>mode:text A|||text B</diff>.
Modes: line (default), word, edit (Levenshtein distance only).

Examples:
- Line diff: <diff>hello\nworld|||hello\nearth</diff>
- Word diff: <diff>word:the quick fox|||the slow fox</diff>
- Edit distance: <diff>edit:kitten|||sitting</diff>`,
  call(content) {
    // Check for mode prefix
    let mode = 'line';
    if (/^(line|word|edit):/.test(content)) {
      mode    = content.slice(0, content.indexOf(':')).toLowerCase();
      content = content.slice(content.indexOf(':') + 1);
    }

    if (mode === 'edit') {
      const sep = content.indexOf('|||');
      if (sep === -1) return 'Format: edit:textA|||textB';
      const a = content.slice(0, sep), b = content.slice(sep + 3);
      const d = levenshtein(a, b);
      return `Edit distance: ${d} (${a.length} → ${b.length} chars, ${d} operation${d === 1 ? '' : 's'})`;
    }

    const sep = content.indexOf('|||');
    if (sep === -1) return 'Format: textA|||textB or mode:textA|||textB';
    const a = content.slice(0, sep), b = content.slice(sep + 3);

    if (mode === 'word') {
      const result  = wordDiff(a, b);
      const added   = (result.match(/\{\+/g) ?? []).length;
      const removed = (result.match(/\[-/g)  ?? []).length;
      return `+${added} -${removed} (word-level)\n${result}`;
    }

    // line mode (default)
    const result  = lineDiff(a, b);
    const added   = (result.match(/^\+/gm) ?? []).length;
    const removed = (result.match(/^-/gm)  ?? []).length;
    return `+${added} -${removed}\n${result}`;
  },
  async handle() {},
};
