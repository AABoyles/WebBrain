// VIN check digit transliteration
const TRANS = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9};
const WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
const MODEL_YEARS = {A:1980,B:1981,C:1982,D:1983,E:1984,F:1985,G:1986,H:1987,J:1988,K:1989,L:1990,M:1991,N:1992,P:1993,R:1994,S:1995,T:1996,V:1997,W:1998,X:1999,Y:2000,1:2001,2:2002,3:2003,4:2004,5:2005,6:2006,7:2007,8:2008,9:2009,A:2010,B:2011,C:2012,D:2013,E:2014,F:2015,G:2016,H:2017,J:2018,K:2019,L:2020,M:2021,N:2022,P:2023,R:2024,S:2025,T:2026,V:2027,W:2028,X:2029,Y:2030};

function checkDigit(vin) {
  const vals = vin.split('').map(c => /\d/.test(c) ? parseInt(c) : (TRANS[c] ?? 0));
  const sum  = vals.reduce((s, v, i) => s + v * WEIGHTS[i], 0);
  const rem  = sum % 11;
  return rem === 10 ? 'X' : String(rem);
}

// Basic WMI → region/country (abbreviated)
const WMI_REGIONS = {
  A:'South Africa',B:'Angola/Kenya',C:'Benin/Madagascar',D:'Mauritius/Tunisia',
  J:'Japan',K:'South Korea',L:'China',M:'India',N:'Indonesia',
  P:'Philippines',R:'Taiwan',S:'UK/Poland/Austria',T:'Switzerland/Czech',
  U:'Denmark/Romania',V:'France/Spain',W:'Germany',X:'Russia',Y:'Belgium/Finland',
  Z:'Italy',1:'USA',2:'Canada',3:'Mexico',4:'USA',5:'USA',6:'Australia',7:'New Zealand',
  9:'Brazil/Argentina',
};

export default {
  tag: 'vin',
  instruction: `VIN DECODER SKILL: To decode a Vehicle Identification Number, call <|tool_call>call:vin{input:<|"|>VIN<|"|>}<tool_call|>.

Example: <|tool_call>call:vin{input:<|"|>1HGCM82633A004352<|"|>}<tool_call|>`,
  call(content) {
    const vin = content.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    if (vin.length !== 17) return `VINs are exactly 17 characters (got ${vin.length}).`;
    const check = checkDigit(vin);
    const valid = vin[8] === check;
    const year  = MODEL_YEARS[vin[9]] ?? 'unknown';
    const region = WMI_REGIONS[vin[0]] ?? 'unknown';
    return [
      `VIN: ${vin}`,
      `Check digit: position 9 = "${vin[8]}", expected "${check}" → ${valid ? '✓ valid' : '✗ invalid'}`,
      `WMI (manufacturer): ${vin.slice(0,3)} (${region})`,
      `VDS (vehicle descriptor): ${vin.slice(3,9)}`,
      `Model year code: ${vin[9]} → ${year}`,
      `Plant code: ${vin[10]}`,
      `Serial number: ${vin.slice(11)}`,
    ].join('\n');
  },
  async handle() {},
};
