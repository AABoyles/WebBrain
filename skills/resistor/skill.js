const COLORS = ['black','brown','red','orange','yellow','green','blue','violet','grey','white'];
const MULTIPLIERS = {'black':1,'brown':10,'red':100,'orange':1e3,'yellow':1e4,'green':1e5,'blue':1e6,'violet':1e7,'grey':1e8,'white':1e9,'gold':0.1,'silver':0.01};
const TOLERANCE = {'brown':'±1%','red':'±2%','green':'±0.5%','blue':'±0.25%','violet':'±0.1%','grey':'±0.05%','gold':'±5%','silver':'±10%','none':'±20%'};

function formatOhms(n) {
  if (n >= 1e9) return `${(n/1e9).toPrecision(3)} GΩ`;
  if (n >= 1e6) return `${(n/1e6).toPrecision(3)} MΩ`;
  if (n >= 1e3) return `${(n/1e3).toPrecision(3)} kΩ`;
  return `${n.toPrecision(3)} Ω`;
}

export default {
  tag: 'resistor',
  instruction: `RESISTOR COLOR CODE SKILL: To decode a resistor color band sequence, call <|tool_call>call:resistor{input:<|"|>band1 band2 band3 multiplier [tolerance]<|"|>}<tool_call|>.

Examples:
- "4-band: red red brown gold" → <|tool_call>call:resistor{input:<|"|>red red brown gold<|"|>}<tool_call|>
- "5-band: orange orange black brown gold" → <|tool_call>call:resistor{input:<|"|>orange orange black brown gold<|"|>}<tool_call|>`,
  call(content) {
    const bands = content.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (bands.length < 3) return 'Provide at least 3 color bands.';

    let value, toleranceStr;
    if (bands.length <= 4) {
      // 4-band: digit digit multiplier [tolerance]
      const d1 = COLORS.indexOf(bands[0]);
      const d2 = COLORS.indexOf(bands[1]);
      const mult = MULTIPLIERS[bands[2]];
      if (d1 === -1 || d2 === -1 || mult === undefined) return 'Unrecognized color band. Valid colors: ' + COLORS.join(', ') + ', gold, silver.';
      value = (d1 * 10 + d2) * mult;
      toleranceStr = TOLERANCE[bands[3] ?? 'none'] ?? '±20%';
    } else {
      // 5-band: digit digit digit multiplier [tolerance]
      const d1 = COLORS.indexOf(bands[0]);
      const d2 = COLORS.indexOf(bands[1]);
      const d3 = COLORS.indexOf(bands[2]);
      const mult = MULTIPLIERS[bands[3]];
      if (d1 === -1 || d2 === -1 || d3 === -1 || mult === undefined) return 'Unrecognized color band.';
      value = (d1 * 100 + d2 * 10 + d3) * mult;
      toleranceStr = TOLERANCE[bands[4] ?? 'none'] ?? '±20%';
    }

    return `Resistance: ${formatOhms(value)} (${toleranceStr})`;
  },
  async handle() {},
};
