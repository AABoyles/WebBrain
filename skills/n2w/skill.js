const ONES  = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS  = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const SCALE = ['','thousand','million','billion','trillion','quadrillion'];

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
  instruction: `NUMBER TO WORDS SKILL: To convert a number to its English word form, emit <n2w>number</n2w>. Supports integers up to quadrillions.

Examples:
- "How do you write 1234 in words?" → <n2w>1234</n2w>
- "Write 1000000 in words" → <n2w>1000000</n2w>`,
  call(content) {
    const n = parseFloat(content.trim().replace(/,/g, ''));
    if (isNaN(n)) return 'Not a valid number.';
    if (Math.abs(n) > 999_999_999_999_999) return 'Number too large (max ±999 trillion).';
    return convert(n);
  },
  async handle() {},
};
