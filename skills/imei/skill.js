function luhn(n) {
  return n.split('').map(Number).reverse().reduce((s, d, i) => {
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    return s + d;
  }, 0) % 10 === 0;
}

// Reporting Body Identifiers (first 2 digits of TAC)
const RBI = {
  '01':'BABT (UK)','35':'BABT (UK)','86':'CYTA (Cyprus)','91':'CYTA (Cyprus)',
  '00':'PTCRB (US)','30':'PTCRB (US)','33':'PTCRB (US)','36':'PTCRB (US)',
  '35':'BABT','45':'BABT','49':'BABT','52':'BABT',
  '01':'BABT','10':'PTCRB','13':'PTCRB','20':'PTCRB',
  '35':'BABT (Europe)','86':'CYTA','89':'IMEI DB',
  '99':'non-assigned',
};

export default {
  tag: 'imei',
  instruction: `IMEI DECODER SKILL: To validate and decode an IMEI (International Mobile Equipment Identity), emit <imei>number</imei>.

Example: <imei>490154203237518</imei>`,
  call(content) {
    const n = content.trim().replace(/[\s\-]/g, '');
    if (!/^\d{15}$/.test(n)) return 'IMEIs are exactly 15 digits.';
    const valid = luhn(n);
    const tac   = n.slice(0, 8);
    const rbi   = n.slice(0, 2);
    const serial = n.slice(8, 14);
    const check  = n[14];
    return [
      `IMEI: ${n.replace(/(\d{2})(\d{6})(\d{6})(\d)/, '$1-$2-$3-$4')}`,
      `Luhn check: ${valid ? '✓ valid' : '✗ invalid'}`,
      `TAC (Type Allocation Code): ${tac}`,
      `  Reporting Body Identifier: ${rbi} — ${RBI[rbi] ?? 'see GSMA IMEI DB'}`,
      `Serial number: ${serial}`,
      `Check digit: ${check}`,
    ].join('\n');
  },
  async handle() {},
};
