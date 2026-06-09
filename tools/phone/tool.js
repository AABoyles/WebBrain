// Country calling codes → metadata
const CODES = {
  1:  { name:'US/Canada', fmt:'(XXX) XXX-XXXX', len:10 },
  7:  { name:'Russia/Kazakhstan', fmt:'(XXX) XXX-XX-XX', len:10 },
  20: { name:'Egypt', len:10 },
  27: { name:'South Africa', fmt:'0XX XXX XXXX', len:9 },
  30: { name:'Greece', len:10 },
  31: { name:'Netherlands', len:9 },
  32: { name:'Belgium', len:9 },
  33: { name:'France', fmt:'0X XX XX XX XX', len:9 },
  34: { name:'Spain', len:9 },
  36: { name:'Hungary', len:9 },
  39: { name:'Italy', len:10 },
  40: { name:'Romania', len:10 },
  41: { name:'Switzerland', len:9 },
  43: { name:'Austria', len:10 },
  44: { name:'UK', fmt:'0XXXX XXXXX', len:10 },
  45: { name:'Denmark', fmt:'XX XX XX XX', len:8 },
  46: { name:'Sweden', len:9 },
  47: { name:'Norway', fmt:'XXX XX XXX', len:8 },
  48: { name:'Poland', fmt:'XXX XXX XXX', len:9 },
  49: { name:'Germany', len:10 },
  51: { name:'Peru', len:9 },
  52: { name:'Mexico', len:10 },
  53: { name:'Cuba', len:8 },
  54: { name:'Argentina', len:10 },
  55: { name:'Brazil', len:11 },
  56: { name:'Chile', len:9 },
  57: { name:'Colombia', len:10 },
  58: { name:'Venezuela', len:10 },
  60: { name:'Malaysia', len:10 },
  61: { name:'Australia', fmt:'0X XXXX XXXX', len:9 },
  62: { name:'Indonesia', len:10 },
  63: { name:'Philippines', len:10 },
  64: { name:'New Zealand', len:9 },
  65: { name:'Singapore', fmt:'XXXX XXXX', len:8 },
  66: { name:'Thailand', len:9 },
  81: { name:'Japan', fmt:'0XX-XXXX-XXXX', len:10 },
  82: { name:'South Korea', len:10 },
  84: { name:'Vietnam', len:10 },
  86: { name:'China', fmt:'1XX XXXX XXXX', len:11 },
  90: { name:'Turkey', len:10 },
  91: { name:'India', fmt:'XXXXX XXXXX', len:10 },
  92: { name:'Pakistan', len:10 },
  93: { name:'Afghanistan', len:9 },
  94: { name:'Sri Lanka', len:9 },
  95: { name:'Myanmar', len:9 },
  98: { name:'Iran', len:10 },
 212: { name:'Morocco', len:9 },
 213: { name:'Algeria', len:9 },
 216: { name:'Tunisia', len:8 },
 218: { name:'Libya', len:9 },
 220: { name:'Gambia', len:7 },
 221: { name:'Senegal', len:9 },
 234: { name:'Nigeria', len:10 },
 254: { name:'Kenya', len:9 },
 255: { name:'Tanzania', len:9 },
 256: { name:'Uganda', len:9 },
 260: { name:'Zambia', len:9 },
 263: { name:'Zimbabwe', len:9 },
 351: { name:'Portugal', len:9 },
 352: { name:'Luxembourg', len:9 },
 353: { name:'Ireland', len:9 },
 354: { name:'Iceland', len:7 },
 358: { name:'Finland', len:9 },
 370: { name:'Lithuania', len:8 },
 371: { name:'Latvia', len:8 },
 372: { name:'Estonia', len:8 },
 380: { name:'Ukraine', len:9 },
 381: { name:'Serbia', len:9 },
 385: { name:'Croatia', len:9 },
 386: { name:'Slovenia', len:8 },
 420: { name:'Czech Republic', len:9 },
 421: { name:'Slovakia', len:9 },
 852: { name:'Hong Kong', fmt:'XXXX XXXX', len:8 },
 853: { name:'Macau', len:8 },
 855: { name:'Cambodia', len:9 },
 856: { name:'Laos', len:9 },
 880: { name:'Bangladesh', len:10 },
 886: { name:'Taiwan', len:9 },
 960: { name:'Maldives', len:7 },
 966: { name:'Saudi Arabia', len:9 },
 971: { name:'UAE', len:9 },
 972: { name:'Israel', len:9 },
 973: { name:'Bahrain', len:8 },
 974: { name:'Qatar', len:8 },
 976: { name:'Mongolia', len:8 },
 977: { name:'Nepal', len:10 },
 992: { name:'Tajikistan', len:9 },
 993: { name:'Turkmenistan', len:8 },
 994: { name:'Azerbaijan', len:9 },
 995: { name:'Georgia', len:9 },
 996: { name:'Kyrgyzstan', len:9 },
 998: { name:'Uzbekistan', len:9 },
};

function normalizeDigits(raw) {
  return raw.replace(/\D/g, '');
}

function findCountryCode(digits) {
  // Try 3-digit, 2-digit, 1-digit codes
  for (const len of [3, 2, 1]) {
    const code = parseInt(digits.slice(0, len));
    if (CODES[code]) return { code, meta: CODES[code], national: digits.slice(len) };
  }
  return null;
}

function formatNational(digits, meta) {
  if (!meta.fmt) return digits;
  let i = 0;
  return meta.fmt.replace(/X/g, () => digits[i++] ?? '').trim();
}

export default {
  tag: 'phone',
  instruction: `PHONE NUMBER SKILL: Parse and format a phone number. call <|tool_call>call:phone{input:<|"|>number<|"|>}<tool_call|>. Include country code with + for international numbers.

Examples:
- "Format +14155552671" → <|tool_call>call:phone{input:<|"|>+14155552671<|"|>}<tool_call|>
- "Parse US number 4155552671" → <|tool_call>call:phone{input:<|"|>+14155552671<|"|>}<tool_call|>
- "Format UK number" → <|tool_call>call:phone{input:<|"|>+447911123456<|"|>}<tool_call|>`,
  call(content) {
    const raw = content.trim();
    const digits = normalizeDigits(raw);
    if (!digits) return 'Provide a phone number.';

    // If starts with + or 00, treat as international
    const isIntl = raw.startsWith('+') || raw.startsWith('00');
    const lookup = digits.startsWith('00') ? digits.slice(2) : digits;
    const found  = isIntl ? findCountryCode(lookup) : null;

    if (found) {
      const { code, meta, national } = found;
      const e164 = `+${code}${national}`;
      const natFormatted = formatNational(national, meta);
      const valid = meta.len ? national.length === meta.len : true;
      return [
        `Country:    ${meta.name} (+${code})`,
        `National:   ${natFormatted}`,
        `E.164:      ${e164}`,
        `Digits:     ${national.length}${meta.len ? ` / ${meta.len} expected` : ''}`,
        valid ? '✓ Length valid' : `✗ Expected ${meta.len} digits, got ${national.length}`,
      ].join('\n');
    }

    // No country code — just normalize and report
    return [
      `Digits:   ${digits}`,
      `Length:   ${digits.length}`,
      `Formatted: +${digits}  (prepend country code for full analysis)`,
    ].join('\n');
  },
  async handle() {},
};
