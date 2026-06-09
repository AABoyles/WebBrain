// MD5 implemented inline (not available in Web Crypto API)
function md5(str) {
  const T = Array.from({length: 64}, (_, i) => (Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
  const S = [
    7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
    5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
    4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
    6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21,
  ];
  const bytes = new TextEncoder().encode(str);
  const len   = bytes.length;
  const pad   = new Uint8Array(Math.ceil((len + 9) / 64) * 64);
  pad.set(bytes);
  pad[len] = 0x80;
  const dv = new DataView(pad.buffer);
  dv.setUint32(pad.length - 8, (len * 8) >>> 0, true);
  dv.setUint32(pad.length - 4, Math.floor(len / 0x20000000), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < pad.length; off += 64) {
    const M = Array.from({length: 16}, (_, i) => dv.getUint32(off + i * 4, true));
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if      (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D;           g = (3 * i + 5) % 16; }
      else             { F = C ^ (B | ~D);         g = (7 * i) % 16; }
      F = (F + A + T[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      const rot = S[i];
      B = ((B + ((F << rot) | (F >>> (32 - rot)))) >>> 0);
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const le = n => n.toString(16).padStart(8, '0').match(/../g).reverse().join('');
  return [a0, b0, c0, d0].map(le).join('');
}

const ALGOS = {
  'md5': 'md5',
  'sha1': 'SHA-1', 'sha-1': 'SHA-1',
  'sha256': 'SHA-256', 'sha-256': 'SHA-256',
  'sha384': 'SHA-384', 'sha-384': 'SHA-384',
  'sha512': 'SHA-512', 'sha-512': 'SHA-512',
};

export default {
  tag: 'hash',
  instruction: `HASH SKILL: To compute a cryptographic hash, call <|tool_call>call:hash{input:<|"|>algorithm:text<|"|>}<tool_call|>. Supported algorithms: md5, sha-1, sha-256, sha-384, sha-512.

Examples:
- "SHA-256 of 'hello world'" → <|tool_call>call:hash{input:<|"|>sha-256:hello world<|"|>}<tool_call|>
- "MD5 of 'hello'" → <|tool_call>call:hash{input:<|"|>md5:hello<|"|>}<tool_call|>`,
  async call(content) {
    const colon = content.indexOf(':');
    if (colon === -1) return 'Format: algorithm:text — e.g. sha-256:hello';
    const key  = content.slice(0, colon).trim().toLowerCase();
    const algo = ALGOS[key];
    if (!algo) return `Unknown algorithm. Supported: ${Object.keys(ALGOS).filter(k => k.includes('-') || k === 'md5').join(', ')}`;
    const text = content.slice(colon + 1);
    if (algo === 'md5') return md5(text);
    try {
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return `Hash error: ${e.message}`;
    }
  },
  async handle() {},
};
