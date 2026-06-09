// 5×5 Polybius square, C/K merged
const GRID = 'ABDEFGHIJLMNOPQRSTUVWXYZ'; // 24 letters, K→C

function letterToTap(letter) {
  letter = letter.toUpperCase();
  if (letter === 'K') letter = 'C';
  const i = GRID.indexOf(letter);
  if (i === -1) return null;
  const row = Math.floor(i / 5) + 1;
  const col = (i % 5) + 1;
  return `${row}-${col}`;
}

function tapToLetter(tap) {
  const m = tap.match(/^(\d)-(\d)$/);
  if (!m) return null;
  const row = parseInt(m[1]) - 1;
  const col = parseInt(m[2]) - 1;
  if (row < 0 || row > 4 || col < 0 || col > 4) return null;
  return GRID[row * 5 + col];
}

export default {
  tag: 'tap',
  instruction: `TAP CODE SKILL: To encode text as tap code or decode tap code, call <|tool_call>call:tap{input:<|"|>text<|"|>}<tool_call|> or <|tool_call>call:tap{input:<|"|>decode:pairs<|"|>}<tool_call|>. Uses a 5×5 Polybius square (C=K).

Examples:
- "Encode 'HELLO' as tap code" → <|tool_call>call:tap{input:<|"|>HELLO<|"|>}<tool_call|>
- "Decode tap: 2-3 1-5 3-1 3-1 3-4" → <|tool_call>call:tap{input:<|"|>decode:2-3 1-5 3-1 3-1 3-4<|"|>}<tool_call|>`,
  call(content) {
    if (/^decode:/i.test(content)) {
      const pairs = content.slice(7).trim().split(/\s+/);
      return pairs.map(p => tapToLetter(p) ?? '?').join('');
    }
    const result = [];
    for (const c of content.toUpperCase()) {
      if (c === ' ') { result.push('/'); continue; }
      const t = letterToTap(c);
      if (t) result.push(t);
    }
    return result.join(' ');
  },
  async handle() {},
};
