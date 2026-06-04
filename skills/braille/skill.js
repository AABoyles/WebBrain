// Grade 1 English Braille — Unicode Braille Patterns block (U+2800)
// Each character: 6 dot bitmask → Unicode code point = 0x2800 + mask
const ALPHA = {
  A:0x01,B:0x03,C:0x09,D:0x19,E:0x11,F:0x0B,G:0x1B,H:0x13,I:0x0A,J:0x1A,
  K:0x05,L:0x07,M:0x0D,N:0x1D,O:0x15,P:0x0F,Q:0x1F,R:0x17,S:0x0E,T:0x1E,
  U:0x25,V:0x27,W:0x3A,X:0x2D,Y:0x3D,Z:0x35,
  ' ':0x00,
};

export default {
  tag: 'braille',
  instruction: `BRAILLE SKILL: To encode English text as Unicode Braille block characters (Grade 1), emit <braille>text</braille>.

Example: <braille>Hello</braille> → ⠓⠑⠇⠇⠕`,
  call(text) {
    return text.toUpperCase().split('').map(c => {
      const mask = ALPHA[c];
      if (mask === undefined) return c;
      return String.fromCodePoint(0x2800 + mask);
    }).join('');
  },
  async handle() {},
};
