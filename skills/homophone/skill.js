const HOMOPHONES = {
  there:['their','they\'re'],their:['there','they\'re'],"they're":['there','their'],
  to:['too','two'],too:['to','two'],two:['to','too'],
  your:['you\'re'],"you're":['your'],
  its:["it's"],"it's":['its'],
  hear:['here'],here:['hear'],
  by:['bye','buy'],bye:['by','buy'],buy:['by','bye'],
  know:['no'],no:['know'],
  new:['knew'],knew:['new'],
  not:['knot'],knot:['not'],
  right:['write','rite'],write:['right','rite'],rite:['right','write'],
  bare:['bear'],bear:['bare'],
  board:['bored'],bored:['board'],
  brake:['break'],break:['brake'],
  hair:['hare'],hare:['hair'],
  heal:['heel','he\'ll'],heel:['heal','he\'ll'],
  hour:['our'],our:['hour'],
  idle:['idol'],idol:['idle'],
  mail:['male'],male:['mail'],
  meat:['meet'],meet:['meat'],
  pair:['pear','pare'],pear:['pair','pare'],
  piece:['peace'],peace:['piece'],
  plain:['plane'],plane:['plain'],
  pour:['pore','poor'],pore:['pour','poor'],poor:['pore','pour'],
  principal:['principle'],principle:['principal'],
  profit:['prophet'],prophet:['profit'],
  rain:['reign','rein'],reign:['rain','rein'],rein:['rain','reign'],
  role:['roll'],roll:['role'],
  sail:['sale'],sale:['sail'],
  scene:['seen'],seen:['scene'],
  sea:['see'],see:['sea'],
  seam:['seem'],seem:['seam'],
  sew:['so','sow'],so:['sew','sow'],sow:['sew','so'],
  sight:['site','cite'],site:['sight','cite'],cite:['sight','site'],
  sole:['soul'],soul:['sole'],
  some:['sum'],sum:['some'],
  stair:['stare'],stare:['stair'],
  stake:['steak'],steak:['stake'],
  stationary:['stationery'],stationery:['stationary'],
  steal:['steel'],steel:['steal'],
  tail:['tale'],tale:['tail'],
  than:['then'],then:['than'],
  threw:['through'],through:['threw'],
  toe:['tow'],tow:['toe'],
  vain:['vane','vein'],vane:['vain','vein'],vein:['vain','vane'],
  waist:['waste'],waste:['waist'],
  wait:['weight'],weight:['wait'],
  war:['wore'],wore:['war'],
  weak:['week'],week:['weak'],
  weather:['whether'],whether:['weather'],
  which:['witch'],witch:['which'],
  whole:['hole'],hole:['whole'],
  wood:['would'],would:['wood'],
  wrap:['rap'],rap:['wrap'],
};

export default {
  tag: 'homophone',
  instruction: `HOMOPHONE LOOKUP SKILL: To find homophones of a word, emit <homophone>word</homophone>.

Examples:
- "Homophones of 'there'" → <homophone>there</homophone>
- "What sounds like 'break'?" → <homophone>break</homophone>`,
  call(content) {
    const word = content.trim().toLowerCase();
    const homs = HOMOPHONES[word];
    if (!homs) return `No homophones found for "${word}" in the built-in table.`;
    return `"${word}" sounds like: ${homs.map(h => `"${h}"`).join(', ')}`;
  },
  async handle() {},
};
