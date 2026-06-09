const BLOCKED = /\b(window|document|fetch|XMLHttpRequest|eval|Function|import|require|process|global|setTimeout|setInterval|clearTimeout|clearInterval|Worker|Blob|URL|indexedDB|localStorage|sessionStorage|navigator|location|history|crypto|performance|console)\b/;

// ── Rational arithmetic (BigInt-backed) for precise: mode ─────────────────────

function gcd(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) { [a, b] = [b, a % b]; }
  return a || 1n;
}
function rat(n, d = 1n) {
  const g = gcd(n < 0n ? -n : n, d < 0n ? -d : d);
  const neg = (n < 0n) !== (d < 0n);
  n = (n < 0n ? -n : n) / g;
  d = (d < 0n ? -d : d) / g;
  return { n: neg ? -n : n, d };
}
function rAdd(a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
function rSub(a, b) { return rat(a.n * b.d - b.n * a.d, a.d * b.d); }
function rMul(a, b) { return rat(a.n * b.n, a.d * b.d); }
function rDiv(a, b) { return rat(a.n * b.d, a.d * b.n); }

function strToRat(s) {
  const dot = s.indexOf('.');
  if (dot === -1) return rat(BigInt(s));
  const scale = s.length - dot - 1;
  return rat(BigInt(s.slice(0, dot) + s.slice(dot + 1)), 10n ** BigInt(scale));
}

function ratToStr(f, maxDec = 20) {
  if (f.d === 1n) return f.n.toString();
  const neg = f.n < 0n;
  const absN = neg ? -f.n : f.n;
  const intPart = absN / f.d;
  let rem = absN % f.d;
  if (rem === 0n) return (neg ? '-' : '') + intPart;
  let dec = '';
  const seen = new Map();
  while (rem !== 0n && dec.length < maxDec) {
    if (seen.has(rem)) {
      const s = seen.get(rem);
      dec = dec.slice(0, s) + '(' + dec.slice(s) + ')';
      return (neg ? '-' : '') + intPart + '.' + dec;
    }
    seen.set(rem, dec.length);
    rem *= 10n;
    dec += (rem / f.d).toString();
    rem %= f.d;
  }
  return (neg ? '-' : '') + intPart + '.' + dec;
}

// Tiny recursive-descent parser for +, -, *, /, unary -, parentheses, decimals
function preciseEval(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if (/[\d.]/.test(expr[i])) {
      let j = i; while (j < expr.length && /[\d.]/.test(expr[j])) j++;
      tokens.push({ t: 'n', v: expr.slice(i, j) }); i = j;
    } else if ('+-*/()^'.includes(expr[i])) {
      tokens.push({ t: 'op', v: expr[i++] });
    } else { throw new Error(`Unexpected: ${expr[i]}`); }
  }
  let pos = 0;
  const peek = () => tokens[pos];
  const eat  = ()  => tokens[pos++];

  function parseExpr() { return parseAdd(); }
  function parseAdd() {
    let l = parseMul();
    while (peek()?.v === '+' || peek()?.v === '-') { const op = eat().v; l = op === '+' ? rAdd(l, parseMul()) : rSub(l, parseMul()); }
    return l;
  }
  function parseMul() {
    let l = parseUnary();
    while (peek()?.v === '*' || peek()?.v === '/') { const op = eat().v; l = op === '*' ? rMul(l, parseUnary()) : rDiv(l, parseUnary()); }
    return l;
  }
  function parseUnary() {
    if (peek()?.v === '-') { eat(); return rat(-parseAtom().n, parseAtom().d); }
    return parseAtom();
  }
  function parseAtom() {
    const tok = peek();
    if (tok?.v === '(') { eat(); const r = parseExpr(); eat(); return r; }
    if (tok?.t === 'n') { eat(); return strToRat(tok.v); }
    throw new Error('Expected number');
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error('Unexpected token after expression');
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

export default {
  tag: 'calc',
  instruction: `CALCULATOR SKILL: For any arithmetic or math, call <|tool_call>call:calc{input:<|"|>JS expression<|"|>}<tool_call|>. For exact decimal precision (no float errors), prefix with precise: e.g. <|tool_call>call:calc{input:<|"|>precise:0.1 + 0.2<|"|>}<tool_call|>. Use Math.* for functions in normal mode.

Examples:
- "17 × 23?" → <|tool_call>call:calc{input:<|"|>17 * 23<|"|>}<tool_call|>
- "√144?" → <|tool_call>call:calc{input:<|"|>Math.sqrt(144)<|"|>}<tool_call|>
- "0.1 + 0.2 exactly?" → <|tool_call>call:calc{input:<|"|>precise:0.1 + 0.2<|"|>}<tool_call|>
- "1/7 as a decimal?" → <|tool_call>call:calc{input:<|"|>precise:1/7<|"|>}<tool_call|>`,
  call(expr) {
    if (expr.trimStart().startsWith('precise:')) {
      const inner = expr.trimStart().slice(8).trim();
      try {
        const result = preciseEval(inner);
        const str = ratToStr(result);
        const note = result.d !== 1n && !str.includes('(') ? `  (= ${result.n}/${result.d})` : '';
        return str + note;
      } catch (e) {
        return 'Precise math error: ' + e.message + '. Note: precise mode supports +, -, *, / and decimals only.';
      }
    }
    if (BLOCKED.test(expr) || /[`]/.test(expr)) return 'Error: disallowed expression';
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function('"use strict"; return (' + expr + ')')();
      return typeof result === 'number'
        ? (isFinite(result) ? parseFloat(result.toPrecision(10)).toString() : String(result))
        : String(result);
    } catch (e) {
      return 'Math error: ' + e.message;
    }
  },
  async handle() {},
};
