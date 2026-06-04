// Pigpen cipher: approximate with Unicode box-drawing and geometric chars
// Grid 1 (A-I): each cell of a tic-tac-toe grid
// Grid 2 (J-R): same but with dot
// X-cross grids for S-Z (4 letters in each)
const PIGPEN = {
  A:'⌐',B:'⌐·',C:'¬',D:'⌐⌐',E:'⌐⌐·',F:'⌐¬',G:'└',H:'└·',I:'┘',
  J:'⌐̣',K:'⌐·̣',L:'¬̣',M:'⌐⌐̣',N:'⌐⌐·̣',O:'⌐¬̣',P:'└̣',Q:'└·̣',R:'┘̣',
  S:'╲',T:'╲·',U:'╱',V:'╱·',W:'⋈',X:'⋈·',
  // Fallback descriptions if symbols aren't clear
};

// Since rendering pigpen symbols accurately in text is limited,
// provide a text description of each letter's grid position
const POSITIONS = {
  A:'top-left of grid (open right, open bottom)',
  B:'top-center of grid (two sides + dot)',
  C:'top-right of grid (open left, open bottom)',
  D:'middle-left of grid (open right)',
  E:'center of grid (closed + dot)',
  F:'middle-right of grid (open left)',
  G:'bottom-left of grid (open right, open top)',
  H:'bottom-center of grid (two sides + dot)',
  I:'bottom-right of grid (open left, open top)',
  J:'top-left of dotted grid',B:'top-center of dotted grid',
  K:'top-right of dotted grid',
  L:'middle-left of dotted grid',M:'center of dotted grid (+ dot)',
  N:'middle-right of dotted grid',
  O:'bottom-left of dotted grid',P:'bottom-center of dotted grid',
  Q:'bottom-right of dotted grid',
  R:'X cross top-right',S:'X cross top-right + dot',
  T:'X cross bottom-left',U:'X cross bottom-left + dot',
  V:'full X (both crosses)',W:'full X + dot',
  X:'X cross bottom-right',Y:'X cross bottom-right + dot',
  Z:'X cross top-left + dot',
};

export default {
  tag: 'pigpen',
  instruction: `PIGPEN CIPHER SKILL: To encode text in the Masonic pigpen cipher, emit <pigpen>text</pigpen>. Returns grid-position descriptions for each letter since the symbols can't be fully rendered in text.

Example: <pigpen>HELLO</pigpen>`,
  call(text) {
    return text.toUpperCase().split('').map(c => {
      if (c === ' ') return '';
      const pos = POSITIONS[c];
      return pos ? `${c}: [${pos}]` : c;
    }).filter(Boolean).join('\n');
  },
  async handle() {},
};
