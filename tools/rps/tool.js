const CHOICES = ['rock','paper','scissors'];
const BEATS   = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

function pick() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return CHOICES[buf[0] % 3];
}

export default {
  tag: 'rps',
  instruction: `ROCK PAPER SCISSORS SKILL: To play rock-paper-scissors against the browser, call <|tool_call>call:rps{input:<|"|>player_choice<|"|>}<tool_call|>.

Examples:
- "I choose rock" → <|tool_call>call:rps{input:<|"|>rock<|"|>}<tool_call|>
- "Play paper" → <|tool_call>call:rps{input:<|"|>paper<|"|>}<tool_call|>`,
  call(content) {
    const player = content.trim().toLowerCase();
    if (!CHOICES.includes(player)) return `Invalid choice. Pick rock, paper, or scissors.`;
    const cpu = pick();
    if (player === cpu) return `Both chose ${cpu}. It's a tie!`;
    const win = BEATS[player] === cpu;
    return `You: ${player} | CPU: ${cpu} → ${win ? 'You win! 🎉' : 'CPU wins! 🤖'}`;
  },
  async handle() {},
};
