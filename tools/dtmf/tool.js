// DTMF frequencies: [row Hz, col Hz] for each key
const DTMF = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], 'A': [697, 1633],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], 'B': [770, 1633],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], 'C': [852, 1633],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477], 'D': [941, 1633],
};

async function playTones(digits) {
  const ac  = new AudioContext();
  let   t   = ac.currentTime + 0.05;
  const dur = 0.15;
  const gap = 0.05;

  for (const d of digits.toUpperCase()) {
    const freqs = DTMF[d];
    if (!freqs) { t += gap; continue; }
    for (const hz of freqs) {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.setValueAtTime(0, t + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    }
    t += dur + gap;
  }
}

export default {
  tag: 'dtmf',
  instruction: `DTMF TONES SKILL: To play phone keypad tones for a sequence of digits, call <|tool_call>call:dtmf{input:<|"|>digits<|"|>}<tool_call|>. Supports 0–9, *, #, A–D.

Examples:
- "Play touch tones for 555-1234" → <|tool_call>call:dtmf{input:<|"|>5551234<|"|>}<tool_call|>
- "What does # sound like?" → <|tool_call>call:dtmf{input:<|"|>#<|"|>}<tool_call|>`,
  async handle(content) {
    const digits = content.replace(/[\s\-().]/g, '');
    if (digits) await playTones(digits);
  },
};
