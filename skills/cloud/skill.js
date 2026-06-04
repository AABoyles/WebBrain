const CLOUDS = {
  cirrus:       {alt:'High (20,000–40,000 ft)', desc:'Thin wispy streaks; ice crystals',                weather:'Fair weather; front approaching in 24h'},
  cirrostratus: {alt:'High (20,000–40,000 ft)', desc:'Thin sheet causing sun/moon halo',              weather:'Rain or snow within 12–24h'},
  cirrocumulus: {alt:'High (16,000–40,000 ft)', desc:'Tiny white puffs in rows ("mackerel sky")',     weather:'Short-lived; may precede tropical storms'},
  altostratus:  {alt:'Mid (6,500–23,000 ft)',   desc:'Grey/blue sheet covering sky',                  weather:'Continuous rain or snow expected'},
  altocumulus:  {alt:'Mid (6,500–23,000 ft)',   desc:'White/grey patches or waves',                   weather:'Possible thunderstorms if seen in morning'},
  nimbostratus: {alt:'Low–Mid (below 10,000 ft)',desc:'Dark grey layer; produces continuous precipitation',weather:'Ongoing rain or snow'},
  stratus:      {alt:'Low (below 6,500 ft)',    desc:'Grey uniform layer; fog-like appearance',        weather:'Drizzle possible; gloomy conditions'},
  stratocumulus:{alt:'Low (1,600–6,500 ft)',    desc:'Lumpy grey/white patches; most common cloud type',weather:'Usually no heavy rain; overcast'},
  cumulus:      {alt:'Low–Mid (1,600–6,500 ft)',desc:'Puffy "fair weather" clouds',                   weather:'Good weather if small; developing if tall'},
  cumulonimbus: {alt:'Low–very high (1,600–60,000 ft)',desc:'Towering anvil-shaped storm cloud',      weather:'Thunderstorms, heavy rain, hail, tornadoes'},
  lenticular:   {alt:'Various',                  desc:'Lens/saucer-shaped; near mountains',            weather:'Strong mountain wave winds; stable air'},
  mammatus:     {alt:'Beneath cumulonimbus',     desc:'Pouch-like protrusions hanging from cloud base',weather:'Associated with severe thunderstorms'},
  fog:          {alt:'Surface level',            desc:'Stratus at ground level',                       weather:'Low visibility; may lift as temperature rises'},
};

export default {
  tag: 'cloud',
  instruction: `CLOUD TYPES SKILL: To look up a cloud type's altitude, description, and weather association, emit <cloud>type</cloud>.

Examples:
- "What is cumulonimbus?" → <cloud>cumulonimbus</cloud>
- "Tell me about lenticular clouds" → <cloud>lenticular</cloud>`,
  call(content) {
    const key = content.trim().toLowerCase();
    const c   = CLOUDS[key];
    if (!c) return `Unknown cloud type "${content}". Types: ${Object.keys(CLOUDS).join(', ')}`;
    return [`${key}:`,`Altitude: ${c.alt}`,`Description: ${c.desc}`,`Weather: ${c.weather}`].join('\n');
  },
  async handle() {},
};
