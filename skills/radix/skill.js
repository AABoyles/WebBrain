const BASES = { bin: 2, binary: 2, oct: 8, octal: 8, dec: 10, decimal: 10, hex: 16, hexadecimal: 16 };
const PREFIX = { bin: '0b', oct: '0o', hex: '0x', dec: '' };
const NAMES  = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hex' };

function detect(s) {
  if (/^0b[01]+$/i.test(s))  return { n: parseInt(s, 2),  from: 2  };
  if (/^0o[0-7]+$/i.test(s)) return { n: parseInt(s, 8),  from: 8  };
  if (/^0x[0-9a-f]+$/i.test(s)) return { n: parseInt(s, 16), from: 16 };
  if (/^\d+$/.test(s))       return { n: parseInt(s, 10), from: 10 };
  return null;
}

export default {
  tag: 'radix',
  instruction: `RADIX CONVERTER SKILL: To convert a number between bases, emit <radix>value to base</radix> or just <radix>value</radix> (shows all bases). Prefix 0b=binary, 0o=octal, 0x=hex; bare digits = decimal.

Examples:
- "255 in hex" → <radix>255 to hex</radix>
- "0xFF in binary" → <radix>0xFF to bin</radix>
- "Show 42 in all bases" → <radix>42</radix>`,
  call(content) {
    content = content.trim();
    const toMatch = content.match(/^(.+?)\s+to\s+(\w+)$/i);
    const src     = toMatch ? toMatch[1].trim() : content;
    const toBase  = toMatch ? BASES[toMatch[2].toLowerCase()] : null;

    const parsed = detect(src);
    if (!parsed) return `Cannot parse "${src}". Use 0b, 0o, 0x prefix or plain decimal.`;

    const { n, from } = parsed;
    if (toBase) {
      const result = n.toString(toBase).toUpperCase();
      return `${NAMES[from] ?? from}: ${src} = ${NAMES[toBase] ?? toBase}: ${result}`;
    }

    return [
      `Decimal:  ${n}`,
      `Hex:      0x${n.toString(16).toUpperCase()}`,
      `Octal:    0o${n.toString(8)}`,
      `Binary:   0b${n.toString(2)}`,
    ].join('\n');
  },
  async handle() {},
};
