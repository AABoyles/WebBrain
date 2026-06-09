const SCORES = {
  A:1,E:1,I:1,O:1,U:1,L:1,N:1,S:1,T:1,R:1,
  D:2,G:2,
  B:3,C:3,M:3,P:3,
  F:4,H:4,V:4,W:4,Y:4,
  K:5,
  J:8,X:8,
  Q:10,Z:10,
};

export default {
  tag: 'scrabble',
  instruction: `SCRABBLE SCORE SKILL: To calculate the Scrabble tile point value of a word, call <|tool_call>call:scrabble{input:<|"|>word<|"|>}<tool_call|>. Does not account for board multipliers.

Examples:
- "Scrabble score for 'quartz'" → <|tool_call>call:scrabble{input:<|"|>quartz<|"|>}<tool_call|>
- "How many points is 'jazz'?" → <|tool_call>call:scrabble{input:<|"|>jazz<|"|>}<tool_call|>`,
  call(word) {
    word = word.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!word) return 'No letters found.';
    const breakdown = word.split('').map(c => `${c}(${SCORES[c] ?? 0})`).join(' + ');
    const total = word.split('').reduce((sum, c) => sum + (SCORES[c] ?? 0), 0);
    return `${breakdown} = ${total} points`;
  },
  async handle() {},
};
