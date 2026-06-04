const CHOICES = ['rock','paper','scissors'];
const BEATS   = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

function pick() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return CHOICES[buf[0] % 3];
}

export default {
  tag: 'rps',
  instruction: `ROCK PAPER SCISSORS SKILL: To play rock-paper-scissors against the browser, emit <rps>player_choice</rps>.

Examples:
- "I choose rock" → <rps>rock</rps>
- "Play paper" → <rps>paper</rps>`,
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
