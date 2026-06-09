const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export default {
  tag: 'freq2note',
  instruction: `FREQUENCY TO NOTE SKILL: To find the nearest musical note to a frequency in Hz, call <|tool_call>call:freq2note{input:<|"|>hz<|"|>}<tool_call|>.

Examples:
- "What note is 440 Hz?" → <|tool_call>call:freq2note{input:<|"|>440<|"|>}<tool_call|>
- "Nearest note to 450 Hz" → <|tool_call>call:freq2note{input:<|"|>450<|"|>}<tool_call|>`,
  call(content) {
    const hz = parseFloat(content.trim());
    if (isNaN(hz) || hz <= 0) return 'Enter a positive frequency in Hz.';
    // MIDI note from frequency: n = 69 + 12*log2(f/440)
    const midi    = 69 + 12 * Math.log2(hz / 440);
    const rounded = Math.round(midi);
    const cents   = Math.round((midi - rounded) * 100);
    const oct     = Math.floor(rounded / 12) - 1;
    const name    = NOTE_NAMES[((rounded % 12) + 12) % 12];
    const exactHz = (440 * Math.pow(2, (rounded - 69) / 12)).toFixed(2);
    const centsStr = cents === 0 ? 'exactly in tune' : `${Math.abs(cents)} cents ${cents > 0 ? 'sharp' : 'flat'}`;
    return `${hz} Hz → ${name}${oct} (exact: ${exactHz} Hz, ${centsStr})`;
  },
  async handle() {},
};
