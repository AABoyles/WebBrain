function encode(text, rails) {
  const fence = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (const ch of text) {
    fence[rail].push(ch);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return fence.flat().join('');
}

function decode(cipher, rails) {
  const n = cipher.length;
  const pattern = [];
  let rail = 0, dir = 1;
  for (let i = 0; i < n; i++) {
    pattern.push(rail);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  const indices = pattern.map((r, i) => [r, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const result = new Array(n);
  for (let i = 0; i < n; i++) result[indices[i][1]] = cipher[i];
  return result.join('');
}

export default {
  tag: 'railfence',
  instruction: `RAIL FENCE CIPHER SKILL: To encode or decode with the rail fence (zigzag) transposition cipher, emit <railfence>rails:text</railfence> to encode or <railfence>decode:rails:text</railfence> to decode.

Examples:
- "Encode 'HELLO' on 3 rails" → <railfence>3:HELLO WORLD</railfence>
- "Decode 'HOLELWRD' on 3 rails" → <railfence>decode:3:HOLELWRD</railfence>`,
  call(content) {
    const dec = content.toLowerCase().startsWith('decode:');
    const rest = dec ? content.slice(7) : content;
    const colon = rest.indexOf(':');
    if (colon === -1) return 'Format: rails:text or decode:rails:text';
    const rails = parseInt(rest.slice(0, colon));
    const text  = rest.slice(colon + 1);
    if (isNaN(rails) || rails < 2) return 'Rails must be ≥ 2.';
    return dec ? decode(text, rails) : encode(text, rails);
  },
  async handle() {},
};
