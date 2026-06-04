const FAMOUS = {
  pi:  { name:'π', value:3.14159265358979323846 },
  e:   { name:'e', value:2.71828182845904523536 },
  phi: { name:'φ (golden ratio)', value:1.61803398874989484820 },
  sqrt2:{ name:'√2', value:1.41421356237309504880 },
  sqrt3:{ name:'√3', value:1.73205080756887729353 },
  sqrt5:{ name:'√5', value:2.23606797749978969640 },
  ln2: { name:'ln 2', value:0.69314718055994530942 },
};

function toCF(x, terms = 10) {
  const cf = [];
  for (let i = 0; i < terms; i++) {
    const a = Math.floor(x);
    cf.push(a);
    x = x - a;
    if (Math.abs(x) < 1e-10) break;
    x = 1 / x;
  }
  return cf;
}

export default {
  tag: 'cf',
  instruction: `CONTINUED FRACTION SKILL: To expand a number as a continued fraction, emit <cf>value</cf>. Supports decimals, fractions (a/b), and named constants: pi, e, phi, sqrt2, sqrt3, sqrt5, ln2.

Examples:
- "Continued fraction of π" → <cf>pi</cf>
- "CF expansion of 3/7" → <cf>3/7</cf>
- "Expand 1.618" → <cf>1.618</cf>`,
  call(content) {
    content = content.trim().toLowerCase();
    let value, label;

    if (FAMOUS[content]) {
      ({ value, name: label } = FAMOUS[content]);
    } else if (content.includes('/')) {
      const [a, b] = content.split('/').map(Number);
      if (isNaN(a) || isNaN(b) || b === 0) return 'Invalid fraction.';
      value = a / b;
      label = `${a}/${b}`;
    } else {
      value = parseFloat(content);
      if (isNaN(value)) return `Unknown value "${content}". Try pi, e, phi, a decimal, or a/b fraction.`;
      label = String(value);
    }

    const cf = toCF(value, 12);
    const str = `[${cf[0]}; ${cf.slice(1).join(', ')}]`;
    return `${label} ≈ ${str}`;
  },
  async handle() {},
};
