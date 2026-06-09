const COUNTRY_INFO = {
  AL:{len:28,name:'Albania'},AD:{len:24,name:'Andorra'},AT:{len:20,name:'Austria'},
  AZ:{len:28,name:'Azerbaijan'},BH:{len:22,name:'Bahrain'},BY:{len:28,name:'Belarus'},
  BE:{len:16,name:'Belgium'},BA:{len:20,name:'Bosnia and Herzegovina'},BR:{len:29,name:'Brazil'},
  BG:{len:22,name:'Bulgaria'},CR:{len:22,name:'Costa Rica'},HR:{len:21,name:'Croatia'},
  CY:{len:28,name:'Cyprus'},CZ:{len:24,name:'Czech Republic'},DK:{len:18,name:'Denmark'},
  DO:{len:28,name:'Dominican Republic'},EG:{len:29,name:'Egypt'},SV:{len:28,name:'El Salvador'},
  EE:{len:20,name:'Estonia'},FK:{len:18,name:'Falkland Islands'},FO:{len:18,name:'Faroe Islands'},
  FI:{len:18,name:'Finland'},FR:{len:27,name:'France'},GE:{len:22,name:'Georgia'},
  DE:{len:22,name:'Germany'},GI:{len:23,name:'Gibraltar'},GR:{len:27,name:'Greece'},
  GL:{len:18,name:'Greenland'},GT:{len:28,name:'Guatemala'},HU:{len:28,name:'Hungary'},
  IS:{len:26,name:'Iceland'},IQ:{len:23,name:'Iraq'},IE:{len:22,name:'Ireland'},
  IL:{len:23,name:'Israel'},IT:{len:27,name:'Italy'},JO:{len:30,name:'Jordan'},
  KZ:{len:20,name:'Kazakhstan'},XK:{len:20,name:'Kosovo'},KW:{len:30,name:'Kuwait'},
  LV:{len:21,name:'Latvia'},LB:{len:28,name:'Lebanon'},LY:{len:25,name:'Libya'},
  LI:{len:21,name:'Liechtenstein'},LT:{len:20,name:'Lithuania'},LU:{len:20,name:'Luxembourg'},
  MT:{len:31,name:'Malta'},MR:{len:27,name:'Mauritania'},MU:{len:30,name:'Mauritius'},
  MC:{len:27,name:'Monaco'},MD:{len:24,name:'Moldova'},MN:{len:20,name:'Mongolia'},
  ME:{len:22,name:'Montenegro'},NL:{len:18,name:'Netherlands'},NI:{len:28,name:'Nicaragua'},
  MK:{len:19,name:'North Macedonia'},NO:{len:15,name:'Norway'},PK:{len:24,name:'Pakistan'},
  PS:{len:29,name:'Palestine'},PL:{len:28,name:'Poland'},PT:{len:25,name:'Portugal'},
  QA:{len:29,name:'Qatar'},RO:{len:24,name:'Romania'},LC:{len:32,name:'Saint Lucia'},
  SM:{len:27,name:'San Marino'},ST:{len:25,name:'São Tomé & Príncipe'},SA:{len:24,name:'Saudi Arabia'},
  RS:{len:22,name:'Serbia'},SC:{len:31,name:'Seychelles'},SK:{len:24,name:'Slovakia'},
  SI:{len:19,name:'Slovenia'},SO:{len:23,name:'Somalia'},ES:{len:24,name:'Spain'},
  SD:{len:18,name:'Sudan'},SE:{len:24,name:'Sweden'},CH:{len:21,name:'Switzerland'},
  TL:{len:23,name:'Timor-Leste'},TN:{len:24,name:'Tunisia'},TR:{len:26,name:'Turkey'},
  UA:{len:29,name:'Ukraine'},AE:{len:23,name:'United Arab Emirates'},GB:{len:22,name:'United Kingdom'},
  VA:{len:22,name:'Vatican City'},VG:{len:24,name:'British Virgin Islands'},YE:{len:30,name:'Yemen'},
};

function mod97(str) {
  let remainder = BigInt(0);
  for (const ch of str) remainder = (remainder * 10n + BigInt(parseInt(ch, 36))) % 97n;
  return Number(remainder);
}

function validateIBAN(iban) {
  // Move first 4 chars to end, convert letters to numbers
  const rearranged = (iban.slice(4) + iban.slice(0, 4))
    .split('').map(c => isNaN(c) ? String(c.charCodeAt(0) - 55) : c).join('');
  return mod97(rearranged) === 1;
}

export default {
  tag: 'iban',
  instruction: `IBAN DECODER SKILL: To decode and validate an International Bank Account Number, call <|tool_call>call:iban{input:<|"|>IBAN<|"|>}<tool_call|>.

Example: <|tool_call>call:iban{input:<|"|>GB82 WEST 1234 5698 7654 32<|"|>}<tool_call|>`,
  call(content) {
    const iban = content.trim().replace(/\s/g, '').toUpperCase();
    if (iban.length < 15 || iban.length > 34) return 'IBANs are 15–34 characters.';
    const country = iban.slice(0, 2);
    const check   = iban.slice(2, 4);
    const bban    = iban.slice(4);
    const info    = COUNTRY_INFO[country];
    const valid   = validateIBAN(iban);
    const expectedLen = info?.len;
    return [
      `IBAN: ${iban.replace(/(.{4})/g, '$1 ').trim()}`,
      `Country: ${country} — ${info?.name ?? 'Unknown'}`,
      `Check digits: ${check}`,
      `BBAN: ${bban}`,
      `MOD-97 check: ${valid ? '✓ valid' : '✗ invalid'}`,
      expectedLen ? `Expected length for ${country}: ${expectedLen} (got ${iban.length})${iban.length === expectedLen ? '' : ' ✗'}` : '',
    ].filter(Boolean).join('\n');
  },
  async handle() {},
};
