const MOHS = [
  {v:1,   min:'Talc',        ex:'Scratched by a fingernail (2.5)'},
  {v:1.5, min:'Talc/Gypsum', ex:'Just above talc'},
  {v:2,   min:'Gypsum',      ex:'Scratched by a fingernail (2.5)'},
  {v:2.5, min:'Fingernail',  ex:'Barely scratches gypsum; scratched by copper coin'},
  {v:3,   min:'Calcite',     ex:'Scratched by a copper coin (3.5)'},
  {v:3.5, min:'Copper coin', ex:'Scratches calcite; scratched by iron nail'},
  {v:4,   min:'Fluorite',    ex:'Scratched by a knife blade (5.5)'},
  {v:5,   min:'Apatite',     ex:'Barely scratched by a knife; scratches glass with difficulty'},
  {v:5.5, min:'Knife blade / glass', ex:'Scratches apatite; scratched by quartz'},
  {v:6,   min:'Orthoclase feldspar', ex:'Scratches glass easily; scratched by quartz'},
  {v:6.5, min:'Iron pyrite', ex:'Scratches glass; scratched by quartz (7)'},
  {v:7,   min:'Quartz',      ex:'Scratches most common minerals; scratched by topaz'},
  {v:8,   min:'Topaz',       ex:'Scratches quartz; scratched by corundum'},
  {v:9,   min:'Corundum (ruby/sapphire)', ex:'Scratches all above; only scratched by diamond'},
  {v:10,  min:'Diamond',     ex:'Hardest known natural material; scratches everything'},
];

export default {
  tag: 'mohs',
  instruction: `MOHS HARDNESS SKILL: To look up a Mohs hardness value, emit <mohs>value</mohs>.

Examples:
- "What is Mohs hardness 7?" → <mohs>7</mohs>
- "What scratch test is Mohs 5?" → <mohs>5</mohs>`,
  call(content) {
    const v = parseFloat(content.trim());
    if (isNaN(v) || v < 1 || v > 10) return 'Mohs scale is 1–10.';
    const entry = MOHS.reduce((best, m) => Math.abs(m.v - v) < Math.abs(best.v - v) ? m : best);
    return `Mohs ${v}: ${entry.min}\n${entry.ex}`;
  },
  async handle() {},
};
