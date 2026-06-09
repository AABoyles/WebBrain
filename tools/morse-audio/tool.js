const TO_MORSE = {
  A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',
  K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',
  U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.',
};

function textToMorse(text) {
  return text.toUpperCase().split('').map(c => {
    if (c === ' ') return '/';
    return TO_MORSE[c] ?? '';
  }).filter(Boolean).join(' ');
}

async function playMorse(morseStr, wpm = 15) {
  const ac  = new AudioContext();
  const dot = 1.2 / wpm; // seconds per dot (PARIS standard)
  let   t   = ac.currentTime + 0.1;

  function beep(dur) {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.005);
    gain.gain.setValueAtTime(0.3, t + dur - 0.005);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur;
  }

  for (const sym of morseStr.split(' ')) {
    if (sym === '/') {
      t += dot * 7; // inter-word gap
      continue;
    }
    for (const ch of sym) {
      if (ch === '.') { beep(dot); t += dot; }
      else if (ch === '-') { beep(dot * 3); t += dot; }
    }
    t += dot * 3; // inter-character gap
  }
}

export default {
  tag: 'morse-audio',
  instruction: `MORSE AUDIO SKILL: To play text as Morse code beeps, call <|tool_call>call:morse-audio{input:<|"|>text to transmit<|"|>}<tool_call|>. The browser will beep the message in proper Morse rhythm.

Examples:
- "Send SOS in Morse audio" → <|tool_call>call:morse-audio{input:<|"|>SOS<|"|>}<tool_call|>
- "Beep out my name" → <|tool_call>call:morse-audio{input:<|"|>Tony<|"|>}<tool_call|>`,
  async handle(content) {
    const morse = textToMorse(content.trim());
    if (morse) await playMorse(morse);
  },
};
