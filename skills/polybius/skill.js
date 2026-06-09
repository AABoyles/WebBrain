// Standard 5×5 Polybius square, I/J merged
const GRID = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 25 letters, J→I

function encode(text) {
  return text.toUpperCase().split('').map(c => {
    if (c === ' ') return ' ';
    if (c === 'J') c = 'I';
    const i = GRID.indexOf(c);
    if (i === -1) return c;
    return `${Math.floor(i/5)+1}${i%5+1}`;
  }).join(' ');
}

function decode(text) {
  const pairs = text.trim().replace(/\s+/g, '').match(/\d\d/g) ?? [];
  return pairs.map(p => {
    const row = parseInt(p[0]) - 1;
    const col = parseInt(p[1]) - 1;
    return GRID[row * 5 + col] ?? '?';
  }).join('');
}

export default {
  tag: 'polybius',
  instruction: `POLYBIUS SQUARE SKILL: To encode or decode with the Polybius square, call <|tool_call>call:polybius{input:<|"|>text<|"|>}<tool_call|> or <|tool_call>call:polybius{input:<|"|>decode:coordinates<|"|>}<tool_call|>. I and J share a cell.

Examples:
- "Encode 'HELLO' in Polybius" → <|tool_call>call:polybius{input:<|"|>HELLO<|"|>}<tool_call|>
- "Decode 23 15 31 31 34" → <|tool_call>call:polybius{input:<|"|>decode:2315313134<|"|>}<tool_call|>`,
  call(content) {
    if (/^decode:/i.test(content)) return decode(content.slice(7));
    return encode(content);
  },
  async handle() {},
};
