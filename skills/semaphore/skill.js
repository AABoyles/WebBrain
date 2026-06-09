// Flag semaphore positions described as clock positions for left/right flags
const SEMAPHORE = {
  A: 'Left:6  Right:5', B: 'Left:7  Right:5', C: 'Left:8  Right:5',
  D: 'Left:3  Right:5', E: 'Left:2  Right:5', F: 'Left:1  Right:5',
  G: 'Left:12 Right:5', H: 'Left:6  Right:7', I: 'Left:6  Right:8',
  J: 'Left:3  Right:12',K: 'Left:6  Right:2', L: 'Left:6  Right:1',
  M: 'Left:6  Right:12',N: 'Left:6  Right:3', O: 'Left:7  Right:3',
  P: 'Left:8  Right:3', Q: 'Left:1  Right:3', R: 'Left:2  Right:3',
  S: 'Left:12 Right:3', T: 'Left:7  Right:8', U: 'Left:2  Right:12',
  V: 'Left:7  Right:12',W: 'Left:1  Right:8', X: 'Left:8  Right:12',
  Y: 'Left:7  Right:1', Z: 'Left:2  Right:1',
};

export default {
  tag: 'semaphore',
  instruction: `SEMAPHORE SKILL: To describe flag semaphore positions for letters, call <|tool_call>call:semaphore{input:<|"|>text<|"|>}<tool_call|>. Positions are given as clock-face angles for left and right flags.

Example: <|tool_call>call:semaphore{input:<|"|>SOS<|"|>}<tool_call|>`,
  call(text) {
    return text.toUpperCase().split('').filter(c => /[A-Z ]/.test(c)).map(c => {
      if (c === ' ') return '';
      const pos = SEMAPHORE[c];
      return pos ? `${c}: ${pos}` : `${c}: (unknown)`;
    }).filter(Boolean).join('\n');
  },
  async handle() {},
};
