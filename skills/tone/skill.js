// Module-level state: one AudioContext shared across invocations
let ctx = null;
let activeOsc = null;

function getCtx() {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
  return ctx;
}

// Note name → Hz (middle octave baseline: C4=261.63)
const NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function noteToHz(note) {
  const m = note.trim().toUpperCase().match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return null;
  const semi = NOTE_BASE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const oct  = parseInt(m[3]);
  // A4 = 440 Hz; MIDI note = 12*(oct+1) + semi; A4 = MIDI 69
  const midi = 12 * (oct + 1) + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export default {
  tag: 'tone',
  instruction: `TONE GENERATOR SKILL: To play or stop a continuous tone, emit <tone>value</tone>. Value can be a frequency in Hz, a note name (e.g. A4, C#5), or "stop".

Examples:
- "Play 440 Hz" → <tone>440</tone>
- "Play A4" → <tone>A4</tone>
- "Stop the tone" → <tone>stop</tone>`,
  async handle(content) {
    content = content.trim().toLowerCase();
    if (content === 'stop') {
      if (activeOsc) { try { activeOsc.stop(); } catch {} activeOsc = null; }
      return;
    }
    const ac = getCtx();
    if (ac.state === 'suspended') await ac.resume();
    if (activeOsc) { try { activeOsc.stop(); } catch {} activeOsc = null; }

    let hz = parseFloat(content);
    if (isNaN(hz)) hz = noteToHz(content);
    if (!hz || hz <= 0) return;

    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.value = 0.25;
    osc.connect(gain).connect(ac.destination);
    osc.start();
    activeOsc = osc;
  },
};
