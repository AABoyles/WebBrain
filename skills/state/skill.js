const STATES = {
  AL:{name:'Alabama',cap:'Montgomery',admit:1819,nick:'Heart of Dixie'},
  AK:{name:'Alaska',cap:'Juneau',admit:1959,nick:'The Last Frontier'},
  AZ:{name:'Arizona',cap:'Phoenix',admit:1912,nick:'Grand Canyon State'},
  AR:{name:'Arkansas',cap:'Little Rock',admit:1836,nick:'Natural State'},
  CA:{name:'California',cap:'Sacramento',admit:1850,nick:'Golden State'},
  CO:{name:'Colorado',cap:'Denver',admit:1876,nick:'Centennial State'},
  CT:{name:'Connecticut',cap:'Hartford',admit:1788,nick:'Constitution State'},
  DE:{name:'Delaware',cap:'Dover',admit:1787,nick:'First State'},
  FL:{name:'Florida',cap:'Tallahassee',admit:1845,nick:'Sunshine State'},
  GA:{name:'Georgia',cap:'Atlanta',admit:1788,nick:'Peach State'},
  HI:{name:'Hawaii',cap:'Honolulu',admit:1959,nick:'Aloha State'},
  ID:{name:'Idaho',cap:'Boise',admit:1890,nick:'Gem State'},
  IL:{name:'Illinois',cap:'Springfield',admit:1818,nick:'Land of Lincoln'},
  IN:{name:'Indiana',cap:'Indianapolis',admit:1816,nick:'Hoosier State'},
  IA:{name:'Iowa',cap:'Des Moines',admit:1846,nick:'Hawkeye State'},
  KS:{name:'Kansas',cap:'Topeka',admit:1861,nick:'Sunflower State'},
  KY:{name:'Kentucky',cap:'Frankfort',admit:1792,nick:'Bluegrass State'},
  LA:{name:'Louisiana',cap:'Baton Rouge',admit:1812,nick:'Pelican State'},
  ME:{name:'Maine',cap:'Augusta',admit:1820,nick:'Pine Tree State'},
  MD:{name:'Maryland',cap:'Annapolis',admit:1788,nick:'Old Line State'},
  MA:{name:'Massachusetts',cap:'Boston',admit:1788,nick:'Bay State'},
  MI:{name:'Michigan',cap:'Lansing',admit:1837,nick:'Great Lakes State'},
  MN:{name:'Minnesota',cap:'Saint Paul',admit:1858,nick:'North Star State'},
  MS:{name:'Mississippi',cap:'Jackson',admit:1817,nick:'Magnolia State'},
  MO:{name:'Missouri',cap:'Jefferson City',admit:1821,nick:'Show Me State'},
  MT:{name:'Montana',cap:'Helena',admit:1889,nick:'Treasure State'},
  NE:{name:'Nebraska',cap:'Lincoln',admit:1867,nick:'Cornhusker State'},
  NV:{name:'Nevada',cap:'Carson City',admit:1864,nick:'Silver State'},
  NH:{name:'New Hampshire',cap:'Concord',admit:1788,nick:'Granite State'},
  NJ:{name:'New Jersey',cap:'Trenton',admit:1787,nick:'Garden State'},
  NM:{name:'New Mexico',cap:'Santa Fe',admit:1912,nick:'Land of Enchantment'},
  NY:{name:'New York',cap:'Albany',admit:1788,nick:'Empire State'},
  NC:{name:'North Carolina',cap:'Raleigh',admit:1789,nick:'Tar Heel State'},
  ND:{name:'North Dakota',cap:'Bismarck',admit:1889,nick:'Peace Garden State'},
  OH:{name:'Ohio',cap:'Columbus',admit:1803,nick:'Buckeye State'},
  OK:{name:'Oklahoma',cap:'Oklahoma City',admit:1907,nick:'Sooner State'},
  OR:{name:'Oregon',cap:'Salem',admit:1859,nick:'Beaver State'},
  PA:{name:'Pennsylvania',cap:'Harrisburg',admit:1787,nick:'Keystone State'},
  RI:{name:'Rhode Island',cap:'Providence',admit:1790,nick:'Ocean State'},
  SC:{name:'South Carolina',cap:'Columbia',admit:1788,nick:'Palmetto State'},
  SD:{name:'South Dakota',cap:'Pierre',admit:1889,nick:'Mount Rushmore State'},
  TN:{name:'Tennessee',cap:'Nashville',admit:1796,nick:'Volunteer State'},
  TX:{name:'Texas',cap:'Austin',admit:1845,nick:'Lone Star State'},
  UT:{name:'Utah',cap:'Salt Lake City',admit:1896,nick:'Beehive State'},
  VT:{name:'Vermont',cap:'Montpelier',admit:1791,nick:'Green Mountain State'},
  VA:{name:'Virginia',cap:'Richmond',admit:1788,nick:'Old Dominion'},
  WA:{name:'Washington',cap:'Olympia',admit:1889,nick:'Evergreen State'},
  WV:{name:'West Virginia',cap:'Charleston',admit:1863,nick:'Mountain State'},
  WI:{name:'Wisconsin',cap:'Madison',admit:1848,nick:'Badger State'},
  WY:{name:'Wyoming',cap:'Cheyenne',admit:1890,nick:'Equality State'},
  DC:{name:'District of Columbia',cap:'Washington',admit:1791,nick:'The District'},
};

const BY_NAME = Object.fromEntries(Object.entries(STATES).map(([k,v]) => [v.name.toUpperCase(), k]));

export default {
  tag: 'state',
  instruction: `US STATE SKILL: To look up a US state by abbreviation or full name, emit <state>value</state>.

Examples:
- "Info on California" → <state>California</state>
- "What state is TX?" → <state>TX</state>`,
  call(content) {
    const input = content.trim().toUpperCase();
    const data  = STATES[input] ?? STATES[BY_NAME[input]];
    if (!data) return `State not found: "${content}". Try "CA", "Texas", etc.`;
    const abbr = STATES[input] ? input : BY_NAME[input];
    return [
      `${data.name} (${abbr})`,
      `Capital: ${data.cap}`,
      `Admitted: ${data.admit}`,
      `Nickname: ${data.nick}`,
    ].join('\n');
  },
  async handle() {},
};
