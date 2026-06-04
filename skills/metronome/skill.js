let ctx    = null;
let ticker = null;

function getCtx() {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
  return ctx;
}

function click(ac, time) {
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.value = 1000;
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  osc.connect(gain).connect(ac.destination);
  osc.start(time);
  osc.stop(time + 0.05);
}

function stop() {
  if (ticker) { clearInterval(ticker); ticker = null; }
}

export default {
  tag: 'metronome',
  instruction: `METRONOME SKILL: To start a metronome, emit <metronome>BPM</metronome>. To stop it, emit <metronome>stop</metronome>.

Examples:
- "Start a metronome at 120 BPM" → <metronome>120</metronome>
- "Stop the metronome" → <metronome>stop</metronome>`,
  async handle(content) {
    content = content.trim().toLowerCase();
    stop();
    if (content === 'stop') return;

    const bpm = parseFloat(content);
    if (!bpm || bpm < 20 || bpm > 300) return;

    const ac       = getCtx();
    if (ac.state === 'suspended') await ac.resume();
    const interval = 60000 / bpm;
    let   next     = ac.currentTime;

    ticker = setInterval(() => {
      while (next < ac.currentTime + 0.1) {
        click(ac, next);
        next += interval / 1000;
      }
    }, 25);
  },
};
