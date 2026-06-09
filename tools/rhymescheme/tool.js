function lastWord(line) {
  const m = line.trim().match(/(\w+)[^\w]*$/);
  return m ? m[1].toLowerCase() : '';
}

function rhymeKey(word) {
  // Approximate rhyme by suffix (last 3 chars, or 2 if short)
  if (!word) return '';
  return word.slice(-Math.min(3, word.length));
}

export default {
  tag: 'rhymescheme',
  instruction: `RHYME SCHEME SKILL: To label the rhyme scheme of a poem, call <|tool_call>call:rhymescheme{input:<|"|>line1 / line2 / line3 / …<|"|>}<tool_call|> (lines separated by " / ").

Example: <|tool_call>call:rhymescheme{input:<|"|>Shall I compare thee to a summer's day / Thou art more lovely and more temperate / Rough winds do shake the darling buds of May / And summer's lease hath all too short a date<|"|>}<tool_call|>`,
  call(content) {
    const lines = content.split('/').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return 'Provide at least 2 lines separated by " / ".';
    const groups = {};
    let nextLabel = 'A'.charCodeAt(0);
    const labels = lines.map(line => {
      const key = rhymeKey(lastWord(line));
      if (!key) return '?';
      if (!groups[key]) groups[key] = String.fromCharCode(nextLabel++);
      return groups[key];
    });
    return lines.map((l, i) => `${labels[i]}  ${l}`).join('\n') + `\n\nScheme: ${labels.join('')}`;
  },
  async handle() {},
};
