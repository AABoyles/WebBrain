function generate(spec) {
  const length = Math.min(Math.max(parseInt(spec.match(/\d+/)?.[0] ?? '16', 10), 4), 256);

  let charset = 'abcdefghijklmnopqrstuvwxyz';
  if (/upper|capital/i.test(spec))           charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (/digit|number|numeric/i.test(spec))    charset += '0123456789';
  if (/symbol|special|punct/i.test(spec))    charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';

  // default: include uppercase and digits
  if (!/upper|capital|digit|number|numeric|symbol|special|punct/i.test(spec)) {
    charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, n => charset[n % charset.length]).join('');
}

export default {
  tag: 'password',
  instruction: `PASSWORD GENERATOR SKILL: When asked to generate a password or passphrase, emit <password>spec</password> to get a cryptographically random result. Do NOT invent one yourself.
Spec is plain English: length (default 16), optionally "upper", "digits", "symbols".

Examples:
- "Generate a strong password" → <password>16 upper digits symbols</password>
- "I need a 24-char password" → <password>24 upper digits symbols</password>
- "Simple 12-char password" → <password>12</password>`,
  call: generate,
  async handle() {},
};
