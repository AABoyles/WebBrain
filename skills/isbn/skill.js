function checkISBN10(digits) {
  const sum = digits.slice(0, 9).reduce((s, d, i) => s + d * (10 - i), 0);
  const check = (11 - (sum % 11)) % 11;
  const last = digits[9];
  return (check === 10 ? 10 : check) === last;
}

function checkISBN13(digits) {
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
  return sum % 10 === 0;
}

function isbn10to13(d10) {
  const prefix = [9, 7, 8, ...d10.slice(0, 9)];
  const sum = prefix.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return [...prefix, check].join('');
}

function isbn13to10(d13) {
  const base = d13.slice(3, 12);
  const sum = base.reduce((s, d, i) => s + d * (10 - i), 0);
  const check = (11 - (sum % 11)) % 11;
  return base.join('') + (check === 10 ? 'X' : String(check));
}

export default {
  tag: 'isbn',
  instruction: `ISBN DECODER SKILL: To validate and decode an ISBN-10 or ISBN-13, emit <isbn>number</isbn>.

Examples:
- "Validate ISBN 978-0-306-40615-7" → <isbn>9780306406157</isbn>
- "Decode this book code" → <isbn>0-306-40615-2</isbn>`,
  call(content) {
    const raw = content.trim().replace(/[\s\-]/g, '').toUpperCase();
    if (raw.length === 10) {
      const digits = raw.slice(0, 9).split('').map(Number).concat(raw[9] === 'X' ? 10 : parseInt(raw[9]));
      if (digits.some(isNaN)) return 'Invalid ISBN-10 characters.';
      const valid = checkISBN10(digits);
      const isbn13 = isbn10to13(digits.map(d => d === 10 ? 0 : d));
      return [
        `ISBN-10: ${raw}`,
        `Check digit: ${valid ? '✓ valid' : '✗ invalid'}`,
        `Equivalent ISBN-13: ${isbn13}`,
      ].join('\n');
    }
    if (raw.length === 13) {
      const digits = raw.split('').map(Number);
      if (digits.some(isNaN)) return 'Invalid ISBN-13 characters.';
      const valid = checkISBN13(digits);
      const starts978 = raw.startsWith('978');
      const isbn10 = starts978 ? isbn13to10(digits) : null;
      const lines = [
        `ISBN-13: ${raw}`,
        `Check digit: ${valid ? '✓ valid' : '✗ invalid'}`,
        `GS1 prefix: ${raw.slice(0,3)} (${raw.startsWith('978') ? 'Book' : raw.startsWith('979') ? 'Book (new prefix)' : 'Unknown'})`,
      ];
      if (isbn10) lines.push(`Equivalent ISBN-10: ${isbn10}`);
      return lines.join('\n');
    }
    return 'Enter a 10 or 13 digit ISBN (dashes/spaces allowed).';
  },
  async handle() {},
};
