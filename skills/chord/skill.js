const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const CHORD_SHAPES = [
  [[0,4,7],   'major'],
  [[0,3,7],   'minor'],
  [[0,4,7,11],'major 7th'],
  [[0,4,7,10],'dominant 7th'],
  [[0,3,7,10],'minor 7th'],
  [[0,3,6],   'diminished'],
  [[0,4,8],   'augmented'],
  [[0,3,6,9], 'diminished 7th'],
  [[0,2,7],   'sus2'],
  [[0,5,7],   'sus4'],
  [[0,4,7,9], 'major 6th'],
  [[0,3,7,9], 'minor 6th'],
];

export default {
  tag: 'chord',
  instruction: `CHORD IDENTIFIER SKILL: To identify a chord from its notes, emit <chord>note1 note2 note3 ...</chord>.

Examples:
- "What chord is C E G?" → <chord>C E G</chord>
- "Identify C Eb G Bb" → <chord>C Eb G Bb</chord>`,
  call(content) {
    const FLATS = {'Db':1,'Eb':3,'Fb':4,'Gb':6,'Ab':8,'Bb':10,'Cb':11};
    const noteNums = content.trim().toUpperCase().split(/[\s,]+/).map(n => {
      let idx = NOTES.indexOf(n);
      if (idx === -1) idx = FLATS[n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()] ?? -1;
      return idx;
    });
    if (noteNums.some(n => n === -1)) return 'Could not parse all notes. Use note names like C, D#, Eb.';

    const results = [];
    for (let root = 0; root < 12; root++) {
      const intervals = [...new Set(noteNums.map(n => ((n - root) % 12 + 12) % 12))].sort((a,b) => a - b);
      for (const [shape, name] of CHORD_SHAPES) {
        if (JSON.stringify(intervals) === JSON.stringify(shape)) {
          results.push(`${NOTES[root]} ${name}`);
        }
      }
    }
    return results.length ? results.join('\n') : 'No standard chord recognized for these notes.';
  },
  async handle() {},
};
