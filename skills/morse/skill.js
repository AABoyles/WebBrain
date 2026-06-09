const TO_MORSE = {
  A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',
  K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',
  U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.',
  '.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','(':'-.--.',')':'-.--.-',
  '&':'.-...',':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','-':'-....-',
  "'":'.----.','"':'.-..-.','@':'.--.-.','!':'-.-.--',
};
const FROM_MORSE = Object.fromEntries(Object.entries(TO_MORSE).map(([k, v]) => [v, k]));

export default {
  tag: 'morse',
  instruction: `MORSE CODE SKILL: To encode text to Morse code or decode Morse, call <|tool_call>call:morse{input:<|"|>text<|"|>}<tool_call|> or <|tool_call>call:morse{input:<|"|>decode:morse code<|"|>}<tool_call|>. Words in Morse are separated by " / ".

Examples:
- "Morse for SOS" → <|tool_call>call:morse{input:<|"|>SOS<|"|>}<tool_call|>
- "Decode ... --- ..." → <|tool_call>call:morse{input:<|"|>decode:... --- ...<|"|>}<tool_call|>
- "Decode SOS in Morse" → <|tool_call>call:morse{input:<|"|>decode:... --- .../<|"|>}<tool_call|>`,
  call(content) {
    if (/^decode:/i.test(content)) {
      const code = content.slice(7).trim();
      return code.split(/\s*\/\s*/).map(word =>
        word.trim().split(/\s+/).map(sym => FROM_MORSE[sym] ?? '?').join('')
      ).join(' ');
    }
    return content.toUpperCase().split('').map(c => {
      if (c === ' ') return '/';
      return TO_MORSE[c] ?? c;
    }).join(' ');
  },
  async handle() {},
};
