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
  instruction: `MORSE CODE SKILL: To encode text to Morse code or decode Morse, emit <morse>text</morse> or <morse>decode:morse code</morse>. Words in Morse are separated by " / ".

Examples:
- "Morse for SOS" → <morse>SOS</morse>
- "Decode ... --- ..." → <morse>decode:... --- ...</morse>
- "Decode SOS in Morse" → <morse>decode:... --- .../</morse>`,
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
