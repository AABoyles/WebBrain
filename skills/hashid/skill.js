// Hashids-compatible encoding (Knuth shuffle alphabet + separator-based encoding)
const DEFAULT_ALPHA  = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
const DEFAULT_SEPS   = 'cfhistuCFHISTU';
const DEFAULT_SALT   = '';
const MIN_HASH_LEN   = 0;

function consistentShuffle(alpha, salt) {
  if (!salt.length) return alpha;
  const arr = alpha.split('');
  let i = arr.length - 1, v = 0, p = 0;
  while (i > 0) {
    v %= salt.length;
    const a = salt.charCodeAt(v);
    p += a;
    const j = (a + v + p) % i;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    i--; v++;
  }
  return arr.join('');
}

function setup(salt = DEFAULT_SALT) {
  let seps   = DEFAULT_SEPS;
  let alpha  = DEFAULT_ALPHA;
  // Remove seps chars from alphabet
  seps  = seps.split('').filter(c => alpha.includes(c)).join('');
  alpha = alpha.split('').filter(c => !seps.includes(c)).join('');
  seps  = consistentShuffle(seps, salt);
  if (!seps.length || (alpha.length / seps.length) > 3.3) {
    let sepsLen = Math.ceil(alpha.length / 3.3);
    if (sepsLen === 1) sepsLen++;
    if (sepsLen > seps.length) { alpha = alpha + seps.slice(seps.length - sepsLen); seps = seps.slice(0, sepsLen); }
    else seps = seps.slice(0, sepsLen);
  }
  alpha = consistentShuffle(alpha, salt);
  const guardCount = Math.ceil(alpha.length / 12);
  let guards;
  if (alpha.length < 3) { guards = seps.slice(0, guardCount); seps = seps.slice(guardCount); }
  else { guards = alpha.slice(0, guardCount); alpha = alpha.slice(guardCount); }
  return { alpha, seps, guards, salt };
}

function encode(numbers, salt = DEFAULT_SALT) {
  if (!numbers.length || numbers.some(n => n < 0 || !Number.isInteger(n))) return '';
  const { alpha, seps, guards, salt: s } = setup(salt);
  const numbersHash = numbers.reduce((acc, n, i) => acc + (n % (i + 100)), 0);
  let ret = alpha[numbersHash % alpha.length];
  const lottery = ret;
  let a = alpha;
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    let cur = a;
    cur = lottery + s + cur;
    a = consistentShuffle(a, cur);
    const last = hash(n, a);
    ret += last;
    if (i + 1 < numbers.length) {
      const sepIdx = (n % (last.charCodeAt(0) + i)) % seps.length;
      ret += seps[sepIdx];
    }
  }
  if (ret.length < MIN_HASH_LEN) {
    const guardIdx = (numbersHash + ret.charCodeAt(0)) % guards.length;
    ret = guards[guardIdx] + ret;
    if (ret.length < MIN_HASH_LEN) ret += guards[(guardIdx + ret.charCodeAt(2)) % guards.length];
  }
  const half = Math.floor(a.length / 2);
  while (ret.length < MIN_HASH_LEN) {
    a = consistentShuffle(a, a);
    ret = a.slice(half) + ret + a.slice(0, half);
  }
  return ret;
}

function hash(n, alpha) {
  let res = '';
  do { res = alpha[n % alpha.length] + res; n = Math.floor(n / alpha.length); } while (n);
  return res;
}

function unhash(h, alpha) {
  return h.split('').reduce((n, c) => n * alpha.length + alpha.indexOf(c), 0);
}

function decode(id, salt = DEFAULT_SALT) {
  if (!id) return [];
  const { alpha, seps, guards, salt: s } = setup(salt);
  const guardsRe = new RegExp(`[${guards}]`);
  const parts = id.split(guardsRe);
  const i = parts.length >= 2 ? 1 : 0;
  const hashArr = parts[i];
  if (!hashArr) return [];
  const lottery = hashArr[0];
  const rest = hashArr.slice(1);
  let a = alpha;
  const result = [];
  for (const part of rest.split(new RegExp(`[${seps}]`))) {
    const cur = lottery + s + a;
    a = consistentShuffle(a, cur);
    result.push(unhash(part, a));
  }
  return result;
}

export default {
  tag: 'hashid',
  instruction: `HASHID SKILL: Encode integers to short YouTube-style IDs and decode back. call <|tool_call>call:hashid{input:<|"|>encode:1,2,3<|"|>}<tool_call|> or <|tool_call>call:hashid{input:<|"|>decode:aBcDeF<|"|>}<tool_call|>. Optionally prefix with a salt: <|tool_call>call:hashid{input:<|"|>encode:salt=mysalt:42<|"|>}<tool_call|>.

Examples:
- "Encode 42" → <|tool_call>call:hashid{input:<|"|>encode:42<|"|>}<tool_call|>
- "Decode 'gY'" → <|tool_call>call:hashid{input:<|"|>decode:gY<|"|>}<tool_call|>
- "Encode with salt" → <|tool_call>call:hashid{input:<|"|>encode:salt=abc:1,2,3<|"|>}<tool_call|>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon < 0) return 'Format: encode:numbers or decode:id';
    const op   = content.slice(0, colon).trim().toLowerCase();
    let   body = content.slice(colon + 1).trim();

    let salt = DEFAULT_SALT;
    const saltMatch = body.match(/^salt=([^:]*):(.*)$/s);
    if (saltMatch) { salt = saltMatch[1]; body = saltMatch[2]; }

    if (op === 'encode') {
      const nums = body.split(',').map(n => parseInt(n.trim(), 10));
      if (nums.some(isNaN)) return 'Provide comma-separated non-negative integers.';
      if (nums.some(n => n < 0)) return 'Only non-negative integers supported.';
      const id = encode(nums, salt);
      return `${nums.join(', ')} → "${id}"`;
    }
    if (op === 'decode') {
      const nums = decode(body.trim(), salt);
      if (!nums.length) return `Could not decode "${body}".`;
      return `"${body}" → ${nums.join(', ')}`;
    }
    return `Unknown op "${op}". Use encode: or decode:`;
  },
  async handle() {},
};
