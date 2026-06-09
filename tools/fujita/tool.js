const EF = [
  {n:0, wind:'65–85 mph (105–137 km/h)',  dmg:'Minor: broken branches, shallow-rooted trees pushed over, some windows broken'},
  {n:1, wind:'86–110 mph (138–177 km/h)', dmg:'Moderate: surface peeled off roofs, mobile homes overturned, moving cars pushed off road'},
  {n:2, wind:'111–135 mph (178–217 km/h)',dmg:'Considerable: roofs torn off, mobile homes demolished, large trees snapped or uprooted'},
  {n:3, wind:'136–165 mph (218–266 km/h)',dmg:'Severe: entire stories of well-constructed houses destroyed, trains overturned'},
  {n:4, wind:'166–200 mph (267–322 km/h)',dmg:'Devastating: well-constructed houses leveled, cars thrown long distances'},
  {n:5, wind:'> 200 mph (> 322 km/h)',    dmg:'Incredible: strong-frame houses swept away, automobile-sized missiles, incredible phenomena'},
];

export default {
  tag: 'fujita',
  instruction: `FUJITA SCALE SKILL: To look up an Enhanced Fujita (EF) tornado rating, call <|tool_call>call:fujita{input:<|"|>EF0 through EF5<|"|>}<tool_call|> or just a number.

Examples:
- "What is an EF3 tornado?" → <|tool_call>call:fujita{input:<|"|>3<|"|>}<tool_call|>
- "Describe EF5 damage" → <|tool_call>call:fujita{input:<|"|>5<|"|>}<tool_call|>`,
  call(content) {
    const n = parseInt(content.trim().replace(/^EF/i,''));
    if (isNaN(n) || n < 0 || n > 5) return 'Enhanced Fujita scale is EF0–EF5.';
    const e = EF[n];
    return [`EF${n}`,`Wind: ${e.wind}`,`Damage: ${e.dmg}`].join('\n');
  },
  async handle() {},
};
