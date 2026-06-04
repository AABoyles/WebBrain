const MAJOR = [
  {name:'The Fool',       upright:'New beginnings, spontaneity, innocence, free spirit',       reversed:'Recklessness, risk-taking, holding back'},
  {name:'The Magician',   upright:'Manifestation, resourcefulness, power, inspired action',    reversed:'Manipulation, poor planning, untapped talents'},
  {name:'The High Priestess',upright:'Intuition, sacred knowledge, divine feminine, subconscious',reversed:'Secrets, disconnected from intuition, repressed feelings'},
  {name:'The Empress',    upright:'Femininity, beauty, nature, nurturing, abundance',          reversed:'Creative block, dependence on others, emptiness'},
  {name:'The Emperor',    upright:'Authority, establishment, structure, father figure',        reversed:'Tyranny, rigidity, lack of discipline'},
  {name:'The Hierophant', upright:'Spiritual wisdom, religious beliefs, conformity, tradition',reversed:'Personal beliefs, freedom, challenging the status quo'},
  {name:'The Lovers',     upright:'Love, harmony, relationships, values alignment, choices',   reversed:'Self-love, disharmony, imbalance, misaligned values'},
  {name:'The Chariot',    upright:'Control, willpower, success, action, determination',        reversed:'Lack of control, aggression, lack of direction'},
  {name:'Strength',       upright:'Strength, courage, persuasion, influence, compassion',      reversed:'Weakness, self-doubt, lack of confidence'},
  {name:'The Hermit',     upright:'Soul-searching, introspection, being alone, inner guidance',reversed:'Isolation, loneliness, withdrawal'},
  {name:'Wheel of Fortune',upright:'Good luck, karma, life cycles, destiny, turning point',   reversed:'Bad luck, resistance to change, breaking cycles'},
  {name:'Justice',        upright:'Justice, fairness, truth, cause and effect, law',           reversed:'Unfairness, lack of accountability, dishonesty'},
  {name:'The Hanged Man', upright:'Pause, surrender, letting go, new perspectives',            reversed:'Delays, resistance, stalling, indecision'},
  {name:'Death',          upright:'Endings, change, transformation, transition',               reversed:'Resistance to change, personal transformation, inner purging'},
  {name:'Temperance',     upright:'Balance, moderation, patience, purpose, meaning',           reversed:'Imbalance, excess, lack of long-term vision'},
  {name:'The Devil',      upright:'Shadow self, attachment, addiction, restriction, sexuality',reversed:'Releasing limiting beliefs, exploring dark thoughts, detachment'},
  {name:'The Tower',      upright:'Sudden change, upheaval, chaos, revelation, awakening',     reversed:'Personal transformation, fear of change, avoiding disaster'},
  {name:'The Star',       upright:'Hope, faith, purpose, renewal, spirituality',               reversed:'Lack of faith, despair, discouragement, insecurity'},
  {name:'The Moon',       upright:'Illusion, fear, the unconscious, intuition, confusion',     reversed:'Release of fear, repressed emotion, inner confusion'},
  {name:'The Sun',        upright:'Positivity, fun, warmth, success, vitality',                reversed:'Inner child, feeling down, overly optimistic'},
  {name:'Judgement',      upright:'Reflection, reckoning, awakening, absolution, inner calling',reversed:'Self-doubt, refusal to learn, stuck in the past'},
  {name:'The World',      upright:'Completion, integration, accomplishment, travel',            reversed:'Seeking closure, shortcuts, lack of completion'},
];

const BY_NAME = Object.fromEntries(MAJOR.map((c,i) => [c.name.toUpperCase(), i]));

export default {
  tag: 'tarot-lookup',
  instruction: `TAROT MAJOR ARCANA SKILL: To look up a tarot card's upright and reversed meanings, emit <tarot-lookup>card name or number</tarot-lookup>.

Examples:
- "What does The Tower mean?" → <tarot-lookup>The Tower</tarot-lookup>
- "Tarot card 0" → <tarot-lookup>0</tarot-lookup>`,
  call(content) {
    content = content.trim();
    const n = parseInt(content);
    const entry = !isNaN(n) ? MAJOR[n] : MAJOR[BY_NAME[content.toUpperCase()]];
    if (!entry) return `Card not found: "${content}". Try a name (The Tower) or number (0–21).`;
    return [`${entry.name}`,`Upright: ${entry.upright}`,`Reversed: ${entry.reversed}`].join('\n');
  },
  async handle() {},
};
