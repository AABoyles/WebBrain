const BEAUFORT = [
  {n:0, desc:'Calm',               wind:'< 1 mph / < 1 km/h',  sea:'Sea like a mirror',                land:'Smoke rises vertically'},
  {n:1, desc:'Light air',          wind:'1–3 mph / 1–5 km/h',  sea:'Ripples, no foam',                 land:'Smoke drift shows wind direction'},
  {n:2, desc:'Light breeze',       wind:'4–7 mph / 6–11 km/h', sea:'Small wavelets',                   land:'Wind felt on face; leaves rustle'},
  {n:3, desc:'Gentle breeze',      wind:'8–12 mph / 12–19 km/h',sea:'Large wavelets; scattered whitecaps',land:'Leaves and twigs in constant motion'},
  {n:4, desc:'Moderate breeze',    wind:'13–18 mph / 20–28 km/h',sea:'Small waves, frequent whitecaps', land:'Dust and loose paper raised'},
  {n:5, desc:'Fresh breeze',       wind:'19–24 mph / 29–38 km/h',sea:'Moderate waves; many whitecaps', land:'Small trees in leaf begin to sway'},
  {n:6, desc:'Strong breeze',      wind:'25–31 mph / 39–49 km/h',sea:'Large waves; extensive whitecaps',land:'Large branches in motion; whistling in wires'},
  {n:7, desc:'Near gale',          wind:'32–38 mph / 50–61 km/h',sea:'Sea heaps; foam streaks',         land:'Whole trees in motion; difficult to walk'},
  {n:8, desc:'Gale',               wind:'39–46 mph / 62–74 km/h',sea:'Moderately high waves; blowing foam',land:'Twigs break; walking very difficult'},
  {n:9, desc:'Strong gale',        wind:'47–54 mph / 75–88 km/h',sea:'High waves; dense foam; spray',   land:'Slight structural damage'},
  {n:10,desc:'Storm',              wind:'55–63 mph / 89–102 km/h',sea:'Very high waves; heavy rolling', land:'Trees uprooted; considerable structural damage'},
  {n:11,desc:'Violent storm',      wind:'64–72 mph / 103–117 km/h',sea:'Exceptionally high waves; foam patches cover sea',land:'Widespread structural damage'},
  {n:12,desc:'Hurricane force',    wind:'≥ 73 mph / ≥ 118 km/h',sea:'Air filled with foam and spray; visibility nil',land:'Catastrophic damage'},
];

export default {
  tag: 'beaufort',
  instruction: `BEAUFORT SCALE SKILL: To look up a Beaufort wind force number, emit <beaufort>number</beaufort>.

Examples:
- "What is Beaufort 7?" → <beaufort>7</beaufort>
- "Describe force 10 wind" → <beaufort>10</beaufort>`,
  call(content) {
    const n = parseInt(content.trim());
    if (isNaN(n) || n < 0 || n > 12) return 'Beaufort scale is 0–12.';
    const b = BEAUFORT[n];
    return [`Beaufort ${n}: ${b.desc}`,`Wind: ${b.wind}`,`Sea: ${b.sea}`,`Land: ${b.land}`].join('\n');
  },
  async handle() {},
};
