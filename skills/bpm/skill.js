export default {
  tag: 'bpm',
  instruction: `BPM TO MS SKILL: To convert BPM to millisecond note durations, emit <bpm>number</bpm>.

Examples:
- "What's 120 BPM in ms?" → <bpm>120</bpm>
- "Note durations at 90 BPM" → <bpm>90</bpm>`,
  call(content) {
    const bpm = parseFloat(content.trim());
    if (isNaN(bpm) || bpm <= 0) return 'Enter a positive BPM value.';
    const beat = 60000 / bpm;
    return [
      `At ${bpm} BPM:`,
      `Whole note:        ${(beat * 4).toFixed(1)} ms`,
      `Half note:         ${(beat * 2).toFixed(1)} ms`,
      `Quarter note:      ${beat.toFixed(1)} ms`,
      `8th note:          ${(beat / 2).toFixed(1)} ms`,
      `16th note:         ${(beat / 4).toFixed(1)} ms`,
      `32nd note:         ${(beat / 8).toFixed(1)} ms`,
      `Dotted quarter:    ${(beat * 1.5).toFixed(1)} ms`,
      `Triplet (8th):     ${(beat / 3).toFixed(1)} ms`,
    ].join('\n');
  },
  async handle() {},
};
