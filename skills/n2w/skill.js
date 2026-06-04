const ONES  = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS  = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const SCALE = ['','thousand','million','billion','trillion','quadrillion'];

// words-to-number lookup maps (reverse direction)
const W2N_ONES  = Object.fromEntries(ONES.slice(1).map((w, i) => [w, i + 1]));
const W2N_TENS  = Object.fromEntries(TENS.slice(2).map((w, i) => [w, (i + 2) * 10]));
const W2N_SCALE = { hundred: 100, thousand: 1000, million: 1e6, billion: 1e9, trillion: 1e12, quadrillion: 1e15 };

function wordsToNumber(str) {
  str = str.toLowerCase().replace(/[,\-]/g, ' ').trim();
  const neg = str.startsWith('negative') || str.startsWith('minus');
  if (neg) str = str.replace(/^(negative|minus)\s*/, '');
  if (str === 'zero') return 0;
  const tokens = str.split(/\s+/).filter(Boolean);
  let total = 0, current = 0;
  for (const t of tokens) {
    if (t === 'hundred') {
      current *= 100;
    } else if (W2N_SCALE[t] && W2N_SCALE[t] >= 1000) {
      total += (current || 1) * W2N_SCALE[t];
      current = 0;
    } else if (W2N_ONES[t] !== undefined) {
      current += W2N_ONES[t];
    } else if (W2N_TENS[t] !== undefined) {
      current += W2N_TENS[t];
    } else if (/^\d+$/.test(t)) {
      current += parseInt(t, 10);
    } else {
      return null; // unrecognised token
    }
  }
  total += current;
  return neg ? -total : total;
}

function hundreds(n) {
  if (n === 0) return '';
  if (n < 20)  return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + hundreds(n % 100) : '');
}

function convert(n) {
  if (n === 0) return 'zero';
  const neg = n < 0;
  n = Math.abs(Math.round(n));
  const parts = [];
  let   s     = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk) parts.unshift(hundreds(chunk) + (SCALE[s] ? ' ' + SCALE[s] : ''));
    n = Math.floor(n / 1000);
    s++;
  }
  return (neg ? 'negative ' : '') + parts.join(', ');
}

export default {
  tag: 'n2w',
  instruction: `NUMBER TO WORDS SKILL: To convert a number to English words, emit <n2w>number</n2w>. To convert English words to a number, emit <n2w>forty-two</n2w>. Supports integers up to quadrillions.

Examples:
- "How do you write 1234 in words?" → <n2w>1234</n2w>
- "What number is 'two million three hundred thousand'?" → <n2w>two million three hundred thousand</n2w>`,
  call(content) {
    const trimmed = content.trim().replace(/,/g, '');
    // If it starts with a digit (or minus/negative followed by digit) → number to words
    if (/^-?\d/.test(trimmed)) {
      const n = parseFloat(trimmed);
      if (isNaN(n)) return 'Not a valid number.';
      if (Math.abs(n) > 999_999_999_999_999) return 'Number too large (max ±999 trillion).';
      return convert(n);
    }
    // Otherwise → words to number
    const result = wordsToNumber(trimmed);
    if (result === null) return `Could not parse "${content}" as a number. Try "forty-two" or "two million".`;
    return String(result);
  },
  async handle() {},
};
