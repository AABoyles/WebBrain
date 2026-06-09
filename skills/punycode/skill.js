// Punycode (RFC 3492) encoder/decoder — Bootstring algorithm
const BASE = 36, TMIN = 1, TMAX = 26, SKEW = 38, DAMP = 700, INITIAL_BIAS = 72, INITIAL_N = 128;

function adapt(delta, numPoints, firstTime) {
  delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > ((BASE - TMIN) * TMAX) >> 1) { delta = Math.floor(delta / (BASE - TMIN)); k += BASE; }
  return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
}

function encodeLabel(label) {
  const input = [...label];
  const output = input.filter(cp => cp < 128);
  let handled = output.length;
  if (handled === input.length) return String.fromCodePoint(...input); // all ASCII, no encoding needed

  const basic = String.fromCodePoint(...output);
  let result = basic ? basic + '-' : '';
  let n = INITIAL_N, delta = 0, bias = INITIAL_BIAS;

  while (handled < input.length) {
    const m = Math.min(...input.filter(cp => cp >= n));
    delta += (m - n) * (handled + 1);
    n = m;
    for (const cp of input) {
      if (cp < n) { delta++; }
      if (cp === n) {
        let q = delta, k = BASE;
        while (true) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          const code = t + (q - t) % (BASE - t);
          result += String.fromCharCode(code < 26 ? code + 97 : code + 22);
          q = Math.floor((q - t) / (BASE - t));
          k += BASE;
        }
        result += String.fromCharCode(q < 26 ? q + 97 : q + 22);
        bias = adapt(delta, handled + 1, handled === output.length);
        delta = 0;
        handled++;
      }
    }
    delta++;
    n++;
  }
  return 'xn--' + result;
}

function decodeLabel(label) {
  if (!label.startsWith('xn--')) return label;
  const input = label.slice(4);
  const output = [];
  const lastDash = input.lastIndexOf('-');
  if (lastDash > 0) {
    for (const ch of input.slice(0, lastDash)) output.push(ch.charCodeAt(0));
  }
  let i = 0, n = INITIAL_N, bias = INITIAL_BIAS;
  let pos = lastDash < 0 ? 0 : lastDash + 1;

  while (pos < input.length) {
    const oldi = i;
    let w = 1, k = BASE;
    while (true) {
      const digit = input.charCodeAt(pos++);
      const d = digit - 48 < 10 ? digit - 22 : digit - 97 < 26 ? digit - 97 : BASE;
      i += d * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (d < t) break;
      w *= BASE - t;
      k += BASE;
    }
    bias = adapt(i - oldi, output.length + 1, oldi === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i, 0, n);
    i++;
  }
  return String.fromCodePoint(...output);
}

// Process full domain (split on dots)
function encodeDomain(domain) {
  return domain.split('.').map(label => encodeLabel([...label].map(c => c.codePointAt(0)))).join('.');
}
function decodeDomain(domain) {
  return domain.split('.').map(decodeLabel).join('.');
}

export default {
  tag: 'punycode',
  instruction: `PUNYCODE SKILL: Encode or decode internationalized domain names (IDN). call <|tool_call>call:punycode{input:<|"|>domain<|"|>}<tool_call|> — auto-detects direction.

Examples:
- "Punycode for münchen.de" → <|tool_call>call:punycode{input:<|"|>münchen.de<|"|>}<tool_call|>
- "Decode xn--mnchen-3ya.de" → <|tool_call>call:punycode{input:<|"|>xn--mnchen-3ya.de<|"|>}<tool_call|>`,
  call(content) {
    const domain = content.trim().toLowerCase();
    if (!domain) return 'Provide a domain name.';

    const hasNonAscii = /[^\x00-\x7F]/.test(domain);
    const hasPunycode = domain.includes('xn--');

    if (hasNonAscii) {
      const encoded = encodeDomain(domain);
      return `Unicode: ${domain}\nPunycode (ACE): ${encoded}`;
    }
    if (hasPunycode) {
      const decoded = decodeDomain(domain);
      if (decoded === domain) return `No punycode labels found in "${domain}".`;
      return `Punycode (ACE): ${domain}\nUnicode: ${decoded}`;
    }
    // All ASCII, no xn-- — encode is identity
    return `"${domain}" is already ASCII — no Punycode encoding needed.`;
  },
  async handle() {},
};
