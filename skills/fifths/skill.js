const CIRCLE = ['C','G','D','A','E','B','F#/Gb','Db','Ab','Eb','Bb','F'];
const SHARPS  = [0,   1,  2,  3,  4,  5,  6,     -5,  -4,  -3,  -2,  -1];
const REL_MIN = ['Am','Em','Bm','F#m','C#m','G#m','D#m/Ebm','Bbm','Fm','Cm','Gm','Dm'];

export default {
  tag: 'fifths',
  instruction: `CIRCLE OF FIFTHS SKILL: To look up a key's position on the circle of fifths, emit <fifths>key</fifths>.

Examples:
- "Circle of fifths for G major" → <fifths>G</fifths>
- "What key is 3 sharps?" → <fifths>A</fifths>`,
  call(content) {
    const key  = content.trim().toUpperCase().replace(/\s+MAJOR/, '').replace(/\s+MINOR/, '');
    const idx  = CIRCLE.findIndex(k => k.split('/').includes(key));
    if (idx === -1) return `Key "${content}" not found. Try C, G, D, A, F, Bb, Eb, Ab, etc.`;

    const sig = SHARPS[idx];
    const sigStr = sig === 0 ? 'No sharps or flats' : sig > 0 ? `${sig} sharp${sig > 1 ? 's' : ''}` : `${-sig} flat${-sig > 1 ? 's' : ''}`;
    const prev = CIRCLE[(idx + 11) % 12];
    const next = CIRCLE[(idx + 1) % 12];

    return [
      `Key: ${CIRCLE[idx]} major`,
      `Key signature: ${sigStr}`,
      `Relative minor: ${REL_MIN[idx]}`,
      `Clockwise (5th up): ${next} major`,
      `Counter-clockwise (5th down): ${prev} major`,
      `Parallel minor: ${CIRCLE[idx].split('/')[0]}m`,
    ].join('\n');
  },
  async handle() {},
};
