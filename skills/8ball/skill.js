const RESPONSES = [
  // Positive
  'It is certain.','It is decidedly so.','Without a doubt.','Yes, definitely.',
  'You may rely on it.','As I see it, yes.','Most likely.','Outlook good.',
  'Yes.','Signs point to yes.',
  // Neutral
  'Reply hazy, try again.','Ask again later.','Better not tell you now.',
  'Cannot predict now.','Concentrate and ask again.',
  // Negative
  "Don't count on it.",'My reply is no.','My sources say no.',
  'Outlook not so good.','Very doubtful.',
];

function pick() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return RESPONSES[buf[0] % RESPONSES.length];
}

export default {
  tag: '8ball',
  instruction: `MAGIC 8-BALL SKILL: For any yes/no question the user wants to leave to chance, emit <8ball>question</8ball>.

Examples:
- "Magic 8-ball: will I get the job?" → <8ball>Will I get the job?</8ball>
- "Ask the 8-ball about my chances" → <8ball>What are my chances?</8ball>`,
  call: () => `🎱 ${pick()}`,
  async handle() {},
};
