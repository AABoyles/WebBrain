const FLIP_MAP = {
  a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',
  n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
  A:'∀',B:'𐐒',C:'Ɔ',D:'◖',E:'Ǝ',F:'Ⅎ',G:'⅁',H:'H',I:'I',J:'ɾ',K:'ʞ',L:'˥',M:'W',
  N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ɹ',S:'S',T:'┴',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z',
  '0':'0','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6',
  '.':'˙',',':'\'','?':'¿','!':'¡','\'':',','"':'„','(':')',')':'(','{':'}','}':'{','[':']',']':'[',
  '<':'>','>':'<','&':'⅋','_':'‾',
};

export default {
  tag: 'flip',
  instruction: `FLIP TEXT SKILL: To render text upside-down using Unicode look-alike characters, call <|tool_call>call:flip{input:<|"|>text<|"|>}<tool_call|>.

Example: <|tool_call>call:flip{input:<|"|>Hello World<|"|>}<tool_call|> → ploM ollǝH`,
  call: text => text.split('').map(c => FLIP_MAP[c] ?? c).reverse().join(''),
  async handle() {},
};
