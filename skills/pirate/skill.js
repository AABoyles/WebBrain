const MAP = [
  [/\bmy\b/gi, 'me'],
  [/\byou\b/gi, "ye"],
  [/\byour\b/gi, "yer"],
  [/\bis\b/gi, 'be'],
  [/\bare\b/gi, 'be'],
  [/\bam\b/gi, 'be'],
  [/\bwith\b/gi, 'wit'],
  [/\bfriend\b/gi, 'matey'],
  [/\bfriends\b/gi, 'mateys'],
  [/\bhi\b/gi, 'ahoy'],
  [/\bhello\b/gi, 'ahoy'],
  [/\bbye\b/gi, "fare thee well"],
  [/\bgoodbye\b/gi, "fare thee well"],
  [/\byes\b/gi, 'aye'],
  [/\bno\b/gi, 'nay'],
  [/\bthe\b/gi, 'th\''],
  [/\btreasure\b/gi, 'booty'],
  [/\bmoney\b/gi, 'doubloons'],
  [/\bgreat\b/gi, 'grand'],
  [/\bgood\b/gi, 'fine'],
  [/\bman\b/gi, 'scallywag'],
  [/\bwoman\b/gi, 'lass'],
  [/\bship\b/gi, 'vessel'],
  [/\bfool\b/gi, 'landlubber'],
  [/\bing\b/gi, "in'"],
];

export default {
  tag: 'pirate',
  instruction: `PIRATE SPEAK SKILL: To translate text into pirate dialect, call <|tool_call>call:pirate{input:<|"|>text<|"|>}<tool_call|>.

Example: <|tool_call>call:pirate{input:<|"|>Hello friend, this is good<|"|>}<tool_call|> → Ahoy matey, this be fine`,
  call(text) {
    let result = text;
    for (const [pattern, replacement] of MAP) result = result.replace(pattern, replacement);
    return result + (text.trim().endsWith('!') ? ' Arrr!' : ', Arrr!');
  },
  async handle() {},
};
