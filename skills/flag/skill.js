// ISO 3166-1 alpha-2 country codes → flag emoji via Unicode regional indicators
// Regional indicator A = U+1F1E6, so A=0, B=1, etc.
function codeToFlag(code) {
  code = code.toUpperCase().trim();
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return null;
  return [...code].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

// Common country name → ISO code lookup
const NAMES = {
  'UNITED STATES':'US','USA':'US','AMERICA':'US','UNITED KINGDOM':'GB','UK':'GB',
  'ENGLAND':'GB','FRANCE':'FR','GERMANY':'DE','ITALY':'IT','SPAIN':'ES',
  'PORTUGAL':'PT','NETHERLANDS':'NL','HOLLAND':'NL','BELGIUM':'BE',
  'SWITZERLAND':'CH','AUSTRIA':'AT','SWEDEN':'SE','NORWAY':'NO','DENMARK':'DK',
  'FINLAND':'FI','POLAND':'PL','CZECH REPUBLIC':'CZ','CZECHIA':'CZ',
  'HUNGARY':'HU','ROMANIA':'RO','GREECE':'GR','TURKEY':'TR','RUSSIA':'RU',
  'UKRAINE':'UA','CANADA':'CA','MEXICO':'MX','BRAZIL':'BR','ARGENTINA':'AR',
  'CHILE':'CL','COLOMBIA':'CO','PERU':'PE','VENEZUELA':'VE',
  'AUSTRALIA':'AU','NEW ZEALAND':'NZ','JAPAN':'JP','CHINA':'CN',
  'SOUTH KOREA':'KR','KOREA':'KR','INDIA':'IN','PAKISTAN':'PK',
  'BANGLADESH':'BD','INDONESIA':'ID','THAILAND':'TH','VIETNAM':'VN',
  'PHILIPPINES':'PH','MALAYSIA':'MY','SINGAPORE':'SG','TAIWAN':'TW',
  'HONG KONG':'HK','IRAN':'IR','IRAQ':'IQ','SAUDI ARABIA':'SA',
  'UAE':'AE','UNITED ARAB EMIRATES':'AE','ISRAEL':'IL','EGYPT':'EG',
  'SOUTH AFRICA':'ZA','NIGERIA':'NG','KENYA':'KE','ETHIOPIA':'ET',
  'GHANA':'GH','TANZANIA':'TZ','MOROCCO':'MA','ALGERIA':'DZ',
};

export default {
  tag: 'flag',
  instruction: `FLAG EMOJI SKILL: To get the flag emoji for a country, emit <flag>country name or ISO code</flag>.

Examples:
- "Flag for France" → <flag>France</flag>
- "US flag emoji" → <flag>US</flag>`,
  call(content) {
    const input = content.trim().toUpperCase();
    // Try direct 2-letter code
    let code = input.length === 2 ? input : NAMES[input];
    if (!code) return `Country not found: "${content}". Try an ISO code (US, FR) or common English name.`;
    const emoji = codeToFlag(code);
    return emoji ? `${emoji} (${code})` : 'Cannot generate flag for that code.';
  },
  async handle() {},
};
