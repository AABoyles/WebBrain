function checkDigit(digits) {
  // GS1 check digit: alternating weights 1,3 from right before check digit
  const d = digits.split('').map(Number);
  const sum = d.reduce((s, v, i) => {
    const weight = (d.length - i) % 2 === 0 ? 3 : 1;
    return s + v * weight;
  }, 0);
  return (10 - (sum % 10)) % 10;
}

function validate(n) {
  const digits = n.slice(0, -1);
  const check  = parseInt(n.slice(-1));
  return checkDigit(digits) === check;
}

const GS1_PREFIXES = [
  [[0,19],'US/Canada (GS1 US)'],
  [[20,29],'Restricted circulation (in-store)'],
  [[30,39],'US drugs (FDA)'],
  [[40,49],'Restricted circulation'],
  [[50,59],'Coupons'],
  [[60,139],'US/Canada (GS1 US)'],
  [[200,299],'Restricted circulation'],
  [[300,379],'France'],
  [[380,380],'Bulgaria'],
  [[383,383],'Slovenia'],
  [[385,385],'Croatia'],
  [[387,387],'Bosnia-Herzegovina'],
  [[389,389],'Montenegro'],
  [[390,399],'Kosovo'],
  [[400,440],'Germany'],
  [[450,459],'Japan'],
  [[460,469],'Russia'],
  [[470,470],'Kyrgyzstan'],
  [[471,471],'Taiwan'],
  [[474,474],'Estonia'],
  [[475,475],'Latvia'],
  [[476,476],'Azerbaijan'],
  [[477,477],'Lithuania'],
  [[478,478],'Uzbekistan'],
  [[479,479],'Sri Lanka'],
  [[480,480],'Philippines'],
  [[481,481],'Belarus'],
  [[482,482],'Ukraine'],
  [[484,484],'Moldova'],
  [[485,485],'Armenia'],
  [[486,486],'Georgia'],
  [[487,487],'Kazakhstan'],
  [[488,488],'Tajikistan'],
  [[489,489],'Hong Kong'],
  [[490,499],'Japan'],
  [[500,509],'UK'],
  [[520,521],'Greece'],
  [[528,528],'Lebanon'],
  [[529,529],'Cyprus'],
  [[530,530],'Albania'],
  [[531,531],'North Macedonia'],
  [[535,535],'Malta'],
  [[539,539],'Ireland'],
  [[540,549],'Belgium/Luxembourg'],
  [[560,560],'Portugal'],
  [[569,569],'Iceland'],
  [[570,579],'Denmark'],
  [[590,590],'Poland'],
  [[594,594],'Romania'],
  [[599,599],'Hungary'],
  [[600,601],'South Africa'],
  [[603,603],'Ghana'],
  [[604,604],'Senegal'],
  [[608,608],'Bahrain'],
  [[609,609],'Mauritius'],
  [[611,611],'Morocco'],
  [[613,613],'Algeria'],
  [[615,615],'Nigeria'],
  [[616,616],'Kenya'],
  [[618,618],"Côte d'Ivoire"],
  [[619,619],'Tunisia'],
  [[620,620],'Tanzania'],
  [[621,621],'Syria'],
  [[622,622],'Egypt'],
  [[623,623],'Brunei'],
  [[624,624],'Libya'],
  [[625,625],'Jordan'],
  [[626,626],'Iran'],
  [[627,627],'Kuwait'],
  [[628,628],'Saudi Arabia'],
  [[629,629],'UAE'],
  [[630,630],'Qatar'],
  [[631,631],'Namibia'],
  [[640,649],'Finland'],
  [[690,699],'China'],
  [[700,709],'Norway'],
  [[729,729],'Israel'],
  [[730,739],'Sweden'],
  [[740,740],'Guatemala'],
  [[741,741],'El Salvador'],
  [[742,742],'Honduras'],
  [[743,743],'Nicaragua'],
  [[744,744],'Costa Rica'],
  [[745,745],'Panama'],
  [[746,746],'Dominican Republic'],
  [[750,750],'Mexico'],
  [[754,755],'Canada'],
  [[759,759],'Venezuela'],
  [[760,769],'Switzerland'],
  [[770,771],'Colombia'],
  [[773,773],'Uruguay'],
  [[775,775],'Peru'],
  [[777,777],'Bolivia'],
  [[778,779],'Argentina'],
  [[780,780],'Chile'],
  [[784,784],'Paraguay'],
  [[786,786],'Ecuador'],
  [[789,790],'Brazil'],
  [[800,839],'Italy'],
  [[840,849],'Spain'],
  [[850,850],'Cuba'],
  [[858,858],'Slovakia'],
  [[859,859],'Czech Republic'],
  [[860,860],'Serbia'],
  [[865,865],'Mongolia'],
  [[867,867],'North Korea'],
  [[868,869],'Turkey'],
  [[870,879],'Netherlands'],
  [[880,880],'South Korea'],
  [[884,884],'Cambodia'],
  [[885,885],'Thailand'],
  [[888,888],'Singapore'],
  [[890,890],'India'],
  [[893,893],'Vietnam'],
  [[896,896],'Pakistan'],
  [[899,899],'Indonesia'],
  [[900,919],'Austria'],
  [[930,939],'Australia'],
  [[940,949],'New Zealand'],
  [[950,950],'GS1 Global Office'],
  [[955,955],'Malaysia'],
  [[958,958],'Macau'],
];

function getGS1Country(prefix3) {
  const p = parseInt(prefix3);
  for (const [[lo, hi], country] of GS1_PREFIXES) {
    if (p >= lo && p <= hi) return country;
  }
  return 'Unknown';
}

export default {
  tag: 'upc',
  instruction: `UPC/EAN BARCODE SKILL: To validate a UPC-A (12 digits) or EAN-13 (13 digits) barcode, call <|tool_call>call:upc{input:<|"|>barcode number<|"|>}<tool_call|>.

Examples:
- "Validate barcode 036000291452" → <|tool_call>call:upc{input:<|"|>036000291452<|"|>}<tool_call|>
- "Decode EAN-13: 5901234123457" → <|tool_call>call:upc{input:<|"|>5901234123457<|"|>}<tool_call|>`,
  call(content) {
    const n = content.trim().replace(/\s/g, '');
    if (!/^\d{12,13}$/.test(n)) return 'Enter 12 digits (UPC-A) or 13 digits (EAN-13).';
    const type   = n.length === 12 ? 'UPC-A' : 'EAN-13';
    const valid  = validate(n);
    const prefix = n.length === 12 ? n.slice(0, 1) : n.slice(0, 3);
    const country = n.length === 13 ? getGS1Country(n.slice(0, 3)) : (n[0] === '0' ? 'US/Canada' : 'Various');
    return [
      `Type:         ${type}`,
      `Barcode:      ${n}`,
      `Check digit:  ${valid ? '✓ valid' : '✗ invalid'}`,
      `GS1 prefix:   ${n.length === 13 ? n.slice(0,3) : '0' + n.slice(0,2)} → ${country}`,
      `Company prefix (approx): ${n.slice(0, n.length === 13 ? 7 : 6)}`,
    ].join('\n');
  },
  async handle() {},
};
