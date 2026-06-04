const MAJOR = [
  ['The Fool','New beginnings, spontaneity, a free spirit'],
  ['The Magician','Manifestation, resourcefulness, power'],
  ['The High Priestess','Intuition, sacred knowledge, divine feminine'],
  ['The Empress','Femininity, beauty, nature, abundance'],
  ['The Emperor','Authority, establishment, structure, a father figure'],
  ['The Hierophant','Spiritual wisdom, traditions, conformity'],
  ['The Lovers','Love, harmony, relationships, values alignment'],
  ['The Chariot','Control, willpower, success, determination'],
  ['Strength','Strength, courage, patience, inner power'],
  ['The Hermit','Soul searching, introspection, being alone'],
  ['Wheel of Fortune','Good luck, karma, life cycles, destiny'],
  ['Justice','Justice, fairness, truth, cause and effect'],
  ['The Hanged Man','Pause, surrender, letting go, new perspectives'],
  ['Death','Endings, change, transformation, transition'],
  ['Temperance','Balance, moderation, patience, purpose'],
  ['The Devil','Shadow self, attachment, addiction, restriction'],
  ['The Tower','Sudden change, upheaval, chaos, revelation'],
  ['The Star','Hope, faith, purpose, renewal, spirituality'],
  ['The Moon','Illusion, fear, the unconscious, confusion'],
  ['The Sun','Positivity, fun, warmth, success, vitality'],
  ['Judgement','Judgement, rebirth, inner calling, absolution'],
  ['The World','Completion, integration, accomplishment, travel'],
];

const SUITS  = ['Wands','Cups','Swords','Pentacles'];
const RANKS  = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
const MINOR  = SUITS.flatMap(s => RANKS.map(r => [`${r} of ${s}`, `${s} energy: ${r}`]));
const DECK   = [...MAJOR, ...MINOR];

function pickCards(n) {
  const deck = [...DECK];
  const drawn = [];
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  for (let i = 0; i < n; i++) {
    const idx = buf[i] % deck.length;
    drawn.push(deck.splice(idx, 1)[0]);
  }
  return drawn;
}

export default {
  tag: 'tarot',
  instruction: `TAROT DRAW SKILL: To draw tarot cards, emit <tarot>1</tarot> for a single card or <tarot>3</tarot> for a past/present/future spread. Do NOT interpret — just draw.

Examples:
- "Draw a tarot card" → <tarot>1</tarot>
- "Do a three-card tarot spread" → <tarot>3</tarot>`,
  call(content) {
    const n = Math.min(Math.max(parseInt(content.trim()) || 1, 1), 10);
    const cards = pickCards(n);
    if (n === 1) return `${cards[0][0]} — ${cards[0][1]}`;
    const positions = n === 3 ? ['Past','Present','Future'] : cards.map((_,i) => `Card ${i+1}`);
    return cards.map((c, i) => `${positions[i]}: ${c[0]} — ${c[1]}`).join('\n');
  },
  async handle() {},
};
