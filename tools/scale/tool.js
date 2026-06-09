const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLATS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

const MODES = {
  major:      [0,2,4,5,7,9,11],
  minor:      [0,2,3,5,7,8,10],
  dorian:     [0,2,3,5,7,9,10],
  phrygian:   [0,1,3,5,7,8,10],
  lydian:     [0,2,4,6,7,9,11],
  mixolydian: [0,2,4,5,7,9,10],
  locrian:    [0,1,3,5,6,8,10],
  pentatonic: [0,2,4,7,9],
  'minor pentatonic':[0,3,5,7,10],
  blues:      [0,3,5,6,7,10],
  harmonic:   [0,2,3,5,7,8,11],
  melodic:    [0,2,3,5,7,9,11],
  chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11],
  wholetone:  [0,2,4,6,8,10],
};

export default {
  tag: 'scale',
  instruction: `KEY & SCALE SKILL: To list the notes of a scale, call <|tool_call>call:scale{input:<|"|>root mode<|"|>}<tool_call|>.
Modes: major, minor, dorian, phrygian, lydian, mixolydian, locrian, pentatonic, blues, harmonic, melodic, chromatic, wholetone.

Examples:
- "C major scale" → <|tool_call>call:scale{input:<|"|>C major<|"|>}<tool_call|>
- "F# phrygian" → <|tool_call>call:scale{input:<|"|>F# phrygian<|"|>}<tool_call|>`,
  call(content) {
    const parts = content.trim().split(/\s+/);
    const root  = parts[0].toUpperCase();
    const mode  = parts.slice(1).join(' ').toLowerCase() || 'major';

    let rootIdx = NOTES.indexOf(root);
    if (rootIdx === -1) rootIdx = FLATS.indexOf(root.charAt(0).toUpperCase() + root.slice(1).toLowerCase());
    if (rootIdx === -1) return `Unknown root note "${root}".`;

    const intervals = MODES[mode];
    if (!intervals) return `Unknown mode "${mode}". Available: ${Object.keys(MODES).join(', ')}`;

    const useFlats = ['F','Bb','Eb','Ab','Db','Gb'].includes(root.charAt(0).toUpperCase() + root.slice(1).toLowerCase());
    const names    = useFlats ? FLATS : NOTES;
    const scaleNotes = intervals.map(i => names[(rootIdx + i) % 12]);

    return `${root} ${mode}: ${scaleNotes.join('  ')}`;
  },
  async handle() {},
};
