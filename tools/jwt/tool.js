function b64urlDecode(str) {
  // Base64url → Base64 → decode
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice(0, (4 - b64.length % 4) % 4);
  return JSON.parse(atob(padded));
}

function fmtTime(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  const now = Date.now();
  const diff = d.getTime() - now;
  const rel = Math.abs(diff) < 60000 ? 'just now'
    : diff < 0 ? `${Math.round(-diff / 60000)} min ago`
    : `in ${Math.round(diff / 60000)} min`;
  return `${d.toISOString()} (${rel})`;
}

export default {
  tag: 'jwt',
  instruction: `JWT DECODER SKILL: To decode a JSON Web Token, call <|tool_call>call:jwt{input:<|"|>token<|"|>}<tool_call|>. The header and payload are decoded and displayed; the signature is NOT verified.

Example: <|tool_call>call:jwt{input:<|"|>eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.sig<|"|>}<tool_call|>`,
  call(content) {
    const parts = content.trim().split('.');
    if (parts.length !== 3) return 'JWTs have three dot-separated parts.';
    try {
      const header  = b64urlDecode(parts[0]);
      const payload = b64urlDecode(parts[1]);
      const lines   = [
        '── Header ──',
        JSON.stringify(header, null, 2),
        '',
        '── Payload ──',
        JSON.stringify(payload, null, 2),
      ];
      if (payload.iat) lines.push(`\nIssued at:  ${fmtTime(payload.iat)}`);
      if (payload.exp) {
        const expStr = fmtTime(payload.exp);
        const expired = Date.now() > payload.exp * 1000;
        lines.push(`Expires:    ${expStr}${expired ? ' ⚠ EXPIRED' : ''}`);
      }
      if (payload.nbf) lines.push(`Not before: ${fmtTime(payload.nbf)}`);
      lines.push('\n⚠ Signature not verified — do not trust claims without server-side validation.');
      return lines.join('\n');
    } catch (e) {
      return `JWT decode error: ${e.message}`;
    }
  },
  async handle() {},
};
