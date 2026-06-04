const SI_PREFIXES = [
  {sym:'Y', name:'yotta',  exp:24,  val:'10²⁴'},
  {sym:'Z', name:'zetta',  exp:21,  val:'10²¹'},
  {sym:'E', name:'exa',    exp:18,  val:'10¹⁸'},
  {sym:'P', name:'peta',   exp:15,  val:'10¹⁵'},
  {sym:'T', name:'tera',   exp:12,  val:'10¹²'},
  {sym:'G', name:'giga',   exp:9,   val:'10⁹'},
  {sym:'M', name:'mega',   exp:6,   val:'10⁶'},
  {sym:'k', name:'kilo',   exp:3,   val:'10³'},
  {sym:'h', name:'hecto',  exp:2,   val:'10²'},
  {sym:'da',name:'deca',   exp:1,   val:'10¹'},
  {sym:'',  name:'(base)', exp:0,   val:'10⁰'},
  {sym:'d', name:'deci',   exp:-1,  val:'10⁻¹'},
  {sym:'c', name:'centi',  exp:-2,  val:'10⁻²'},
  {sym:'m', name:'milli',  exp:-3,  val:'10⁻³'},
  {sym:'µ', name:'micro',  exp:-6,  val:'10⁻⁶'},
  {sym:'n', name:'nano',   exp:-9,  val:'10⁻⁹'},
  {sym:'p', name:'pico',   exp:-12, val:'10⁻¹²'},
  {sym:'f', name:'femto',  exp:-15, val:'10⁻¹⁵'},
  {sym:'a', name:'atto',   exp:-18, val:'10⁻¹⁸'},
  {sym:'z', name:'zepto',  exp:-21, val:'10⁻²¹'},
  {sym:'y', name:'yocto',  exp:-24, val:'10⁻²⁴'},
];
const BINARY = [
  {sym:'Ki',name:'kibi', val:'2¹⁰ = 1,024'},
  {sym:'Mi',name:'mebi', val:'2²⁰ = 1,048,576'},
  {sym:'Gi',name:'gibi', val:'2³⁰ ≈ 1.07×10⁹'},
  {sym:'Ti',name:'tebi', val:'2⁴⁰ ≈ 1.10×10¹²'},
  {sym:'Pi',name:'pebi', val:'2⁵⁰ ≈ 1.13×10¹⁵'},
  {sym:'Ei',name:'exbi', val:'2⁶⁰ ≈ 1.15×10¹⁸'},
];

export default {
  tag: 'si',
  instruction: `SI PREFIX SKILL: To look up an SI or binary prefix, emit <si>prefix</si>.

Examples:
- "What does µ mean?" → <si>µ</si>
- "What is giga?" → <si>giga</si>
- "Binary prefix Mi" → <si>Mi</si>`,
  call(content) {
    const q = content.trim();
    // Try SI symbol
    const si = SI_PREFIXES.find(p => p.sym === q || p.name.toLowerCase() === q.toLowerCase());
    if (si) return `${si.name} (${si.sym || 'no symbol'}): ${si.val} = 10^${si.exp}`;
    // Try binary
    const bin = BINARY.find(p => p.sym === q || p.name.toLowerCase() === q.toLowerCase());
    if (bin) return `${bin.name} (${bin.sym}): ${bin.val}`;
    return `Unknown prefix "${q}". SI: Y Z E P T G M k h da d c m µ n p f a z y\nBinary: Ki Mi Gi Ti Pi Ei`;
  },
  async handle() {},
};
