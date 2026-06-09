const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLATS = {Db:1,Eb:3,Fb:4,Gb:6,Ab:8,Bb:10,Cb:11};

const INTERVAL_NAMES = [
  'Unison','Minor 2nd','Major 2nd','Minor 3rd','Major 3rd',
  'Perfect 4th','Tritone','Perfect 5th','Minor 6th','Major 6th',
  'Minor 7th','Major 7th','Octave',
];

function noteIdx(n) {
  n = n.trim();
  const upper = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  let idx = NOTES.indexOf(upper.toUpperCase());
  if (idx === -1) idx = FLATS[upper] ?? -1;
  return idx;
}

export default {
  tag: 'interval',
  instruction: `INTERVAL CALCULATOR SKILL: To find the interval between two notes, call <|tool_call>call:interval{input:<|"|>note1 note2<|"|>}<tool_call|>.

Examples:
- "Interval from C to G" → <|tool_call>call:interval{input:<|"|>C G<|"|>}<tool_call|>
- "What is C to F#?" → <|tool_call>call:interval{input:<|"|>C F#<|"|>}<tool_call|>`,
  call(content) {
    const parts = content.trim().split(/[\s,]+/);
    if (parts.length < 2) return 'Provide two notes: e.g. C G';
    const a = noteIdx(parts[0]);
    const b = noteIdx(parts[1]);
    if (a === -1) return `Cannot parse "${parts[0]}" as a note.`;
    if (b === -1) return `Cannot parse "${parts[1]}" as a note.`;
    const semis = ((b - a) % 12 + 12) % 12;
    return `${parts[0].toUpperCase()} → ${parts[1].toUpperCase()}: ${INTERVAL_NAMES[semis]} (${semis} semitone${semis !== 1 ? 's' : ''})`;
  },
  async handle() {},
};
