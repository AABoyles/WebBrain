const CURRENCIES = {
  USD:{name:'US Dollar',symbol:'$',countries:'United States, Ecuador, El Salvador, Zimbabwe…'},
  EUR:{name:'Euro',symbol:'€',countries:'Eurozone (20 EU member states)'},
  GBP:{name:'British Pound Sterling',symbol:'£',countries:'United Kingdom'},
  JPY:{name:'Japanese Yen',symbol:'¥',countries:'Japan'},
  CNY:{name:'Chinese Yuan Renminbi',symbol:'¥',countries:'China'},
  INR:{name:'Indian Rupee',symbol:'₹',countries:'India'},
  CAD:{name:'Canadian Dollar',symbol:'CA$',countries:'Canada'},
  AUD:{name:'Australian Dollar',symbol:'A$',countries:'Australia, Pacific Island states'},
  CHF:{name:'Swiss Franc',symbol:'Fr',countries:'Switzerland, Liechtenstein'},
  SEK:{name:'Swedish Krona',symbol:'kr',countries:'Sweden'},
  NOK:{name:'Norwegian Krone',symbol:'kr',countries:'Norway'},
  DKK:{name:'Danish Krone',symbol:'kr',countries:'Denmark'},
  NZD:{name:'New Zealand Dollar',symbol:'NZ$',countries:'New Zealand'},
  SGD:{name:'Singapore Dollar',symbol:'S$',countries:'Singapore'},
  HKD:{name:'Hong Kong Dollar',symbol:'HK$',countries:'Hong Kong'},
  KRW:{name:'South Korean Won',symbol:'₩',countries:'South Korea'},
  MXN:{name:'Mexican Peso',symbol:'MX$',countries:'Mexico'},
  BRL:{name:'Brazilian Real',symbol:'R$',countries:'Brazil'},
  RUB:{name:'Russian Ruble',symbol:'₽',countries:'Russia'},
  ZAR:{name:'South African Rand',symbol:'R',countries:'South Africa'},
  TRY:{name:'Turkish Lira',symbol:'₺',countries:'Turkey'},
  AED:{name:'UAE Dirham',symbol:'د.إ',countries:'United Arab Emirates'},
  SAR:{name:'Saudi Riyal',symbol:'﷼',countries:'Saudi Arabia'},
  ILS:{name:'Israeli New Shekel',symbol:'₪',countries:'Israel'},
  PLN:{name:'Polish Zloty',symbol:'zł',countries:'Poland'},
  CZK:{name:'Czech Koruna',symbol:'Kč',countries:'Czech Republic'},
  HUF:{name:'Hungarian Forint',symbol:'Ft',countries:'Hungary'},
  RON:{name:'Romanian Leu',symbol:'lei',countries:'Romania'},
  IDR:{name:'Indonesian Rupiah',symbol:'Rp',countries:'Indonesia'},
  MYR:{name:'Malaysian Ringgit',symbol:'RM',countries:'Malaysia'},
  PHP:{name:'Philippine Peso',symbol:'₱',countries:'Philippines'},
  THB:{name:'Thai Baht',symbol:'฿',countries:'Thailand'},
  VND:{name:'Vietnamese Dong',symbol:'₫',countries:'Vietnam'},
  PKR:{name:'Pakistani Rupee',symbol:'₨',countries:'Pakistan'},
  BDT:{name:'Bangladeshi Taka',symbol:'৳',countries:'Bangladesh'},
  EGP:{name:'Egyptian Pound',symbol:'E£',countries:'Egypt'},
  NGN:{name:'Nigerian Naira',symbol:'₦',countries:'Nigeria'},
  KES:{name:'Kenyan Shilling',symbol:'KSh',countries:'Kenya'},
  GHS:{name:'Ghanaian Cedi',symbol:'₵',countries:'Ghana'},
  MAD:{name:'Moroccan Dirham',symbol:'MAD',countries:'Morocco'},
  CLP:{name:'Chilean Peso',symbol:'CL$',countries:'Chile'},
  COP:{name:'Colombian Peso',symbol:'CO$',countries:'Colombia'},
  PEN:{name:'Peruvian Sol',symbol:'S/',countries:'Peru'},
  ARS:{name:'Argentine Peso',symbol:'AR$',countries:'Argentina'},
  UYU:{name:'Uruguayan Peso',symbol:'UY$',countries:'Uruguay'},
  VES:{name:'Venezuelan Bolívar',symbol:'Bs.S',countries:'Venezuela'},
  TWD:{name:'New Taiwan Dollar',symbol:'NT$',countries:'Taiwan'},
  UAH:{name:'Ukrainian Hryvnia',symbol:'₴',countries:'Ukraine'},
  QAR:{name:'Qatari Riyal',symbol:'QR',countries:'Qatar'},
  KWD:{name:'Kuwaiti Dinar',symbol:'KD',countries:'Kuwait (highest-valued currency)'},
  BHD:{name:'Bahraini Dinar',symbol:'BD',countries:'Bahrain'},
  OMR:{name:'Omani Rial',symbol:'OMR',countries:'Oman'},
  JOD:{name:'Jordanian Dinar',symbol:'JD',countries:'Jordan'},
  LKR:{name:'Sri Lankan Rupee',symbol:'Rs',countries:'Sri Lanka'},
  NPR:{name:'Nepalese Rupee',symbol:'Rs',countries:'Nepal'},
  KZT:{name:'Kazakhstani Tenge',symbol:'₸',countries:'Kazakhstan'},
  UZS:{name:'Uzbekistani Som',symbol:'сум',countries:'Uzbekistan'},
  BTN:{name:'Bhutanese Ngultrum',symbol:'Nu',countries:'Bhutan'},
  MVR:{name:'Maldivian Rufiyaa',symbol:'Rf',countries:'Maldives'},
  MMK:{name:'Myanmar Kyat',symbol:'K',countries:'Myanmar'},
  KHR:{name:'Cambodian Riel',symbol:'៛',countries:'Cambodia'},
  LAK:{name:'Lao Kip',symbol:'₭',countries:'Laos'},
  MNT:{name:'Mongolian Tögrög',symbol:'₮',countries:'Mongolia'},
  XOF:{name:'West African CFA franc',symbol:'CFA',countries:'Benin, Burkina Faso, Côte d\'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo'},
  XAF:{name:'Central African CFA franc',symbol:'FCFA',countries:'Cameroon, CAR, Chad, DRC, Equatorial Guinea, Gabon, Republic of Congo'},
  BTC:{name:'Bitcoin',symbol:'₿',countries:'Decentralized'},
  ETH:{name:'Ethereum',symbol:'Ξ',countries:'Decentralized'},
};

const BY_NAME = Object.fromEntries(Object.entries(CURRENCIES).map(([k,v]) => [v.name.toUpperCase(), k]));

export default {
  tag: 'currency',
  instruction: `CURRENCY SKILL: To look up a currency by ISO 4217 code or name, emit <currency>value</currency>.

Examples:
- "What is JPY?" → <currency>JPY</currency>
- "Tell me about the Euro" → <currency>EUR</currency>`,
  call(content) {
    const input = content.trim().toUpperCase();
    const code  = CURRENCIES[input] ? input : BY_NAME[input];
    const data  = code ? CURRENCIES[code] : null;
    if (!data) return `Currency not found: "${content}". Try an ISO code (USD, EUR) or full name.`;
    return [
      `${data.name} (${code})`,
      `Symbol: ${data.symbol}`,
      `Used in: ${data.countries}`,
    ].join('\n');
  },
  async handle() {},
};
