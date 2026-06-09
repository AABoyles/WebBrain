const AFFIXES = {
  // Common prefixes
  'un-':    {type:'prefix',meaning:'not / reverse of',examples:'unhappy, undo, unbelievable'},
  're-':    {type:'prefix',meaning:'again / back',examples:'redo, restart, return, recycle'},
  'pre-':   {type:'prefix',meaning:'before',examples:'prefix, preview, predict, prepare'},
  'post-':  {type:'prefix',meaning:'after',examples:'postwar, postscript, postpone'},
  'anti-':  {type:'prefix',meaning:'against / opposite',examples:'antibiotic, antisocial, antidote'},
  'non-':   {type:'prefix',meaning:'not',examples:'nonsense, nonprofit, nonviolent'},
  'dis-':   {type:'prefix',meaning:'not / apart / away',examples:'disagree, disconnect, disorder'},
  'mis-':   {type:'prefix',meaning:'wrongly / badly',examples:'misplace, misread, mistake'},
  'over-':  {type:'prefix',meaning:'too much / above',examples:'overdo, overcook, overlook'},
  'under-': {type:'prefix',meaning:'too little / below',examples:'underestimate, underpay'},
  'out-':   {type:'prefix',meaning:'surpassing / external',examples:'outrun, outwit, outdoor'},
  'sub-':   {type:'prefix',meaning:'under / below',examples:'submarine, subway, subtitle'},
  'super-': {type:'prefix',meaning:'above / beyond',examples:'supernatural, superior, supermarket'},
  'inter-': {type:'prefix',meaning:'between / among',examples:'international, internet, interact'},
  'intra-': {type:'prefix',meaning:'within',examples:'intramural, intranet, intravenous'},
  'extra-': {type:'prefix',meaning:'outside / beyond',examples:'extraordinary, extraterrestrial'},
  'semi-':  {type:'prefix',meaning:'half',examples:'semicircle, semifinal, semiconductor'},
  'bi-':    {type:'prefix',meaning:'two',examples:'bicycle, bilingual, biweekly'},
  'tri-':   {type:'prefix',meaning:'three',examples:'triangle, tricycle, trilogy'},
  'multi-': {type:'prefix',meaning:'many',examples:'multiply, multicultural, multimedia'},
  'uni-':   {type:'prefix',meaning:'one',examples:'unique, uniform, universe'},
  'mono-':  {type:'prefix',meaning:'one/single',examples:'monologue, monopoly, monotone'},
  'micro-': {type:'prefix',meaning:'very small',examples:'microscope, microchip, microwave'},
  'macro-': {type:'prefix',meaning:'large/long',examples:'macroeconomics, macroscopic'},
  'mega-':  {type:'prefix',meaning:'great/million',examples:'megabyte, megaphone, megacity'},
  'mini-':  {type:'prefix',meaning:'small',examples:'minivan, minimize, miniature'},
  'mid-':   {type:'prefix',meaning:'middle',examples:'midnight, midpoint, midterm'},
  'fore-':  {type:'prefix',meaning:'before/front',examples:'forecast, forehead, foresee'},
  'auto-':  {type:'prefix',meaning:'self',examples:'autobiography, automatic, automobile'},
  'neo-':   {type:'prefix',meaning:'new',examples:'neoclassical, neologism, neonatal'},
  'ex-':    {type:'prefix',meaning:'former / out of',examples:'exhale, export, ex-president'},
  'co-':    {type:'prefix',meaning:'together/joint',examples:'cooperate, coauthor, coexist'},
  'counter-':{type:'prefix',meaning:'against/opposite',examples:'counteract, counterattack'},
  // Common suffixes
  '-tion':  {type:'suffix',meaning:'act/process/state of',examples:'education, satisfaction, creation'},
  '-sion':  {type:'suffix',meaning:'act/process/state of',examples:'permission, tension, revision'},
  '-ness':  {type:'suffix',meaning:'state/quality of',examples:'happiness, darkness, kindness'},
  '-ment':  {type:'suffix',meaning:'action/result/state',examples:'enjoyment, movement, development'},
  '-ity':   {type:'suffix',meaning:'state/quality of',examples:'ability, creativity, clarity'},
  '-ty':    {type:'suffix',meaning:'state/quality of',examples:'beauty, liberty, loyalty'},
  '-ous':   {type:'suffix',meaning:'having the quality of',examples:'nervous, dangerous, famous'},
  '-ious':  {type:'suffix',meaning:'characterized by',examples:'curious, obvious, previous'},
  '-ful':   {type:'suffix',meaning:'full of/tending to',examples:'helpful, colorful, beautiful'},
  '-less':  {type:'suffix',meaning:'without',examples:'helpless, homeless, careless'},
  '-able':  {type:'suffix',meaning:'able to / capable of',examples:'readable, comfortable, believable'},
  '-ible':  {type:'suffix',meaning:'able to / capable of',examples:'flexible, possible, visible'},
  '-ive':   {type:'suffix',meaning:'tending to / of the nature of',examples:'active, creative, massive'},
  '-al':    {type:'suffix',meaning:'relating to',examples:'national, musical, additional'},
  '-ic':    {type:'suffix',meaning:'relating to / characterized by',examples:'music, electric, atomic'},
  '-ical':  {type:'suffix',meaning:'relating to',examples:'comical, logical, musical'},
  '-ism':   {type:'suffix',meaning:'doctrine/practice/system',examples:'socialism, capitalism, Buddhism'},
  '-ist':   {type:'suffix',meaning:'one who practices / believer in',examples:'artist, biologist, realist'},
  '-er':    {type:'suffix',meaning:'one who does / comparative',examples:'teacher, runner, bigger'},
  '-or':    {type:'suffix',meaning:'one who does',examples:'actor, doctor, director'},
  '-ology': {type:'suffix',meaning:'study/science of',examples:'biology, psychology, archaeology'},
  '-logy':  {type:'suffix',meaning:'study of',examples:'geology, technology, theology'},
  '-fy':    {type:'suffix',meaning:'to make / to cause',examples:'clarify, simplify, magnify'},
  '-ize':   {type:'suffix',meaning:'to make / to become',examples:'organize, realize, modernize'},
  '-ise':   {type:'suffix',meaning:'to make / to become (British)',examples:'organise, realise, modernise'},
  '-en':    {type:'suffix',meaning:'to make / to become',examples:'soften, brighten, darken'},
  '-ly':    {type:'suffix',meaning:'in a manner of / like',examples:'quickly, friendly, lovely'},
  '-ward':  {type:'suffix',meaning:'direction toward',examples:'forward, backward, upward'},
  '-wise':  {type:'suffix',meaning:'in the manner/direction of',examples:'clockwise, otherwise, likewise'},
  '-ship':  {type:'suffix',meaning:'state/condition/tool',examples:'friendship, leadership, hardship'},
  '-hood':  {type:'suffix',meaning:'state/condition',examples:'childhood, brotherhood, neighborhood'},
  '-dom':   {type:'suffix',meaning:'domain/state/condition',examples:'freedom, kingdom, boredom'},
  '-ling':  {type:'suffix',meaning:'small/young/diminutive',examples:'duckling, seedling, sibling'},
  '-ling':  {type:'suffix',meaning:'small or young',examples:'duckling, seedling, sibling'},
};

export default {
  tag: 'affix',
  instruction: `PREFIX/SUFFIX MEANINGS SKILL: To look up the meaning of a prefix or suffix, call <|tool_call>call:affix{input:<|"|>morpheme<|"|>}<tool_call|>. Include the hyphen to indicate position.

Examples:
- "What does 'un-' mean?" → <|tool_call>call:affix{input:<|"|>un-<|"|>}<tool_call|>
- "Meaning of '-ology'" → <|tool_call>call:affix{input:<|"|>-ology<|"|>}<tool_call|>
- "What is the '-ful' suffix?" → <|tool_call>call:affix{input:<|"|>-ful<|"|>}<tool_call|>`,
  call(content) {
    const key = content.trim().toLowerCase();
    const a   = AFFIXES[key];
    if (!a) return `Affix "${key}" not found. Include the hyphen (e.g. "un-" or "-tion").`;
    return [`${key} (${a.type}): "${a.meaning}"`,`Examples: ${a.examples}`].join('\n');
  },
  async handle() {},
};
