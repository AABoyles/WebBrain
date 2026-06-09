const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function midiToName(n) {
  const oct  = Math.floor(n / 12) - 1;
  const note = NOTE_NAMES[n % 12];
  const freq = (440 * Math.pow(2, (n - 69) / 12)).toFixed(2);
  return `MIDI ${n} = ${note}${oct} (${freq} Hz)`;
}

function nameToMidi(name) {
  const m = name.trim().toUpperCase().match(/^([A-G][#B]?)(-?\d+)$/);
  if (!m) return null;
  let semis = NOTE_NAMES.indexOf(m[1]);
  if (semis === -1) { // Handle flats
    const flatMap = {CB:11,DB:1,EB:3,FB:4,GB:6,AB:8,BB:10};
    semis = flatMap[m[1]];
    if (semis === undefined) return null;
  }
  const oct = parseInt(m[2]);
  return semis + (oct + 1) * 12;
}

export default {
  tag: 'midi',
  instruction: `MIDI NOTE SKILL: To decode a MIDI note number to note name and frequency, or convert a note name to MIDI, call <|tool_call>call:midi{input:<|"|>value<|"|>}<tool_call|>.

Examples:
- "What MIDI note is 60?" → <|tool_call>call:midi{input:<|"|>60<|"|>}<tool_call|>
- "What MIDI number is A4?" → <|tool_call>call:midi{input:<|"|>A4<|"|>}<tool_call|>`,
  call(content) {
    content = content.trim();
    const n = parseInt(content);
    if (!isNaN(n) && String(n) === content) {
      if (n < 0 || n > 127) return 'MIDI notes are 0–127.';
      return midiToName(n);
    }
    const midi = nameToMidi(content);
    if (midi === null) return `Cannot parse "${content}". Try a number (60) or note name (C4, A#3).`;
    if (midi < 0 || midi > 127) return `${content} is outside MIDI range (0–127).`;
    return midiToName(midi);
  },
  async handle() {},
};
