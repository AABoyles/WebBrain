const CYCLE = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const ELEMENTS = ['Metal','Metal','Water','Water','Wood','Wood','Fire','Fire','Earth','Earth'];
const YIN_YANG = (year) => year % 2 === 0 ? 'Yang' : 'Yin';

const TRAITS = {
  Rat:'Clever, adaptable, quick-witted, resourceful',
  Ox:'Diligent, dependable, strong, determined',
  Tiger:'Brave, competitive, confident, unpredictable',
  Rabbit:'Quiet, elegant, kind, responsible',
  Dragon:'Energetic, fearless, warm-hearted, charismatic',
  Snake:'Enigmatic, intuitive, introverted, refined',
  Horse:'Animated, active, energetic, independent',
  Goat:'Calm, gentle, sympathetic, creative',
  Monkey:'Sharp, smart, curious, mischievous',
  Rooster:'Observant, hardworking, courageous, resourceful',
  Dog:'Loyal, honest, amiable, kind',
  Pig:'Compassionate, generous, diligent, stubborn',
};

export default {
  tag: 'zodiac-cn',
  instruction: `CHINESE ZODIAC SKILL: To find someone's Chinese zodiac animal and element, call <|tool_call>call:zodiac-cn{input:<|"|>birth year<|"|>}<tool_call|>.

Examples:
- "Chinese zodiac for 1990" → <|tool_call>call:zodiac-cn{input:<|"|>1990<|"|>}<tool_call|>
- "What's the sign for 2000?" → <|tool_call>call:zodiac-cn{input:<|"|>2000<|"|>}<tool_call|>`,
  call(content) {
    const year = parseInt(content.trim());
    if (isNaN(year) || year < 1) return 'Enter a year.';
    const animal  = CYCLE[(year - 4) % 12];
    const element = ELEMENTS[(year - 4) % 10];
    const polarity = YIN_YANG(year);
    return [`Year ${year}: ${animal}`,`Element: ${element}  Polarity: ${polarity}`,`Traits: ${TRAITS[animal]}`].join('\n');
  },
  async handle() {},
};
