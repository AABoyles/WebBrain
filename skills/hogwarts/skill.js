const HOUSES = ['Gryffindor','Hufflepuff','Ravenclaw','Slytherin'];
const TRAITS  = {
  Gryffindor: 'Bravery, courage, nerve, and chivalry',
  Hufflepuff: 'Hard work, patience, justice, and loyalty',
  Ravenclaw:  'Intelligence, creativity, learning, and wit',
  Slytherin:  'Ambition, cunning, leadership, and resourcefulness',
};

function sortName(name) {
  // Simple deterministic hash of the name
  const n = name.toUpperCase().replace(/[^A-Z]/g,'');
  let hash = 0;
  for (const c of n) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return HOUSES[hash % 4];
}

export default {
  tag: 'hogwarts',
  instruction: `HOGWARTS SORTING SKILL: To sort a name into a Hogwarts house (deterministically based on the name hash), emit <hogwarts>name</hogwarts>.

Examples:
- "Which house am I in?" → <hogwarts>Harry Potter</hogwarts>
- "Sort my name" → <hogwarts>Hermione Granger</hogwarts>`,
  call(content) {
    const name  = content.trim();
    const house = sortName(name);
    return `${name} → ${house}\n${TRAITS[house]}`;
  },
  async handle() {},
};
