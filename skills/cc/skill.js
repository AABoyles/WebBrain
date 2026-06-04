function luhn(n) {
  const digits = n.split('').map(Number).reverse();
  const sum = digits.reduce((s, d, i) => {
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    return s + d;
  }, 0);
  return sum % 10 === 0;
}

function issuer(n) {
  if (/^4/.test(n))                     return 'Visa';
  if (/^5[1-5]/.test(n))               return 'Mastercard';
  if (/^2[2-7]/.test(n))               return 'Mastercard';
  if (/^3[47]/.test(n))                return 'American Express';
  if (/^6(?:011|5|22)/.test(n))        return 'Discover';
  if (/^35/.test(n))                   return 'JCB';
  if (/^62/.test(n))                   return 'UnionPay';
  if (/^3(?:0[0-5]|[68])/.test(n))    return 'Diners Club';
  return 'Unknown';
}

export default {
  tag: 'cc',
  instruction: `CREDIT CARD DECODER SKILL: To validate and identify a credit card number, emit <cc>number</cc>. Only the structure is analyzed — nothing is stored or transmitted.

Example: <cc>4532015112830366</cc>`,
  call(content) {
    const n = content.trim().replace(/[\s\-]/g, '');
    if (!/^\d{13,19}$/.test(n)) return 'Enter 13–19 digits (spaces/dashes allowed).';
    const valid = luhn(n);
    const brand = issuer(n);
    // Mask all but last 4
    const masked = '*'.repeat(n.length - 4) + n.slice(-4);
    return [
      `Number: ${masked}`,
      `Length: ${n.length} digits`,
      `Issuer: ${brand}`,
      `Luhn check: ${valid ? '✓ valid' : '✗ invalid'}`,
    ].join('\n');
  },
  async handle() {},
};
