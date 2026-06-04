const NATO = {
  A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',
  I:'India',J:'Juliett',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',
  Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',
  X:'X-ray',Y:'Yankee',Z:'Zulu',
  '0':'Zero','1':'One','2':'Two','3':'Three','4':'Four',
  '5':'Five','6':'Six','7':'Seven','8':'Eight','9':'Nine',
};

export default {
  tag: 'nato',
  instruction: `NATO PHONETIC SKILL: To spell something using the NATO phonetic alphabet, emit <nato>text</nato>.

Examples:
- "Spell Tony in NATO" → <nato>Tony</nato>
- "What's NATO for ABC?" → <nato>ABC</nato>`,
  call: text => text.toUpperCase().split('').map(c => NATO[c] ?? c).join(' · '),
  async handle() {},
};
