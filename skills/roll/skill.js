function randomInt(n) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % n;
}

function parseDice(expr) {
  expr = expr.trim().toLowerCase().replace(/\s+/g, '');

  if (expr === 'coin' || expr === 'heads' || expr === 'tails') {
    return randomInt(2) === 0 ? 'Heads' : 'Tails';
  }

  const m = expr.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!m) return `Invalid dice notation: "${expr}". Try d20, 2d6, 3d8+5, or coin.`;

  const count = parseInt(m[1] || '1', 10);
  const sides = parseInt(m[2], 10);
  const mod   = m[3] ? parseInt(m[3], 10) : 0;

  if (count < 1 || count > 100) return 'Dice count must be 1–100.';
  if (sides < 2 || sides > 10000) return 'Sides must be 2–10000.';

  const rolls = Array.from({ length: count }, () => randomInt(sides) + 1);
  const sum   = rolls.reduce((a, b) => a + b, 0);
  const total = sum + mod;

  if (count === 1 && mod === 0) return `d${sides}: ${total}`;

  const modStr = mod !== 0 ? ` ${mod > 0 ? '+' : ''}${mod}` : '';
  return `${count}d${sides}${modStr}: [${rolls.join(', ')}]${modStr} = ${total}`;
}

export default {
  tag: 'roll',
  instruction: `DICE ROLLER SKILL: For any dice roll or coin flip, call <|tool_call>call:roll{input:<|"|>expression<|"|>}<tool_call|> instead of guessing.
Supports: d20, 2d6, 3d8+5, d100, coin.

Examples:
- "Roll a d20" → <|tool_call>call:roll{input:<|"|>d20<|"|>}<tool_call|>
- "Roll 2d6 plus 3 for damage" → <|tool_call>call:roll{input:<|"|>2d6+3<|"|>}<tool_call|>
- "Flip a coin" → <|tool_call>call:roll{input:<|"|>coin<|"|>}<tool_call|>`,
  call: parseDice,
  async handle() {},
};
