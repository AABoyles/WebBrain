const ALGOS = { 'sha1': 'SHA-1', 'sha-1': 'SHA-1', 'sha256': 'SHA-256', 'sha-256': 'SHA-256', 'sha384': 'SHA-384', 'sha-384': 'SHA-384', 'sha512': 'SHA-512', 'sha-512': 'SHA-512' };

export default {
  tag: 'hash',
  instruction: `HASH SKILL: To compute a cryptographic hash, emit <hash>algorithm:text</hash>. Supported algorithms: sha-1, sha-256, sha-384, sha-512.

Examples:
- "SHA-256 of 'hello world'" → <hash>sha-256:hello world</hash>
- "MD5-equivalent? Use SHA-256" → <hash>sha-256:your text</hash>`,
  async call(content) {
    const colon = content.indexOf(':');
    if (colon === -1) return 'Format: algorithm:text — e.g. sha-256:hello';
    const algo = ALGOS[content.slice(0, colon).trim().toLowerCase()];
    if (!algo) return `Unknown algorithm. Supported: ${Object.keys(ALGOS).filter(k => k.includes('-')).join(', ')}`;
    const text = content.slice(colon + 1);
    try {
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return `Hash error: ${e.message}`;
    }
  },
  async handle() {},
};
