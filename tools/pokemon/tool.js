export default {
  tag: 'pokemon',
  instruction: `POKÉDEX SKILL: To look up a Pokémon by name or number, call <|tool_call>call:pokemon{input:<|"|>name or number<|"|>}<tool_call|>.

Examples:
- "What is Pikachu?" → <|tool_call>call:pokemon{input:<|"|>pikachu<|"|>}<tool_call|>
- "Look up Pokémon #1" → <|tool_call>call:pokemon{input:<|"|>1<|"|>}<tool_call|>`,
  async call(content) {
    const query = content.trim().toLowerCase().replace(/\s+/g,'-');
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`);
      if (!res.ok) return `Pokémon "${content}" not found.`;
      const p = await res.json();
      const types  = p.types.map(t => t.type.name).join(', ');
      const stats  = p.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join('  ');
      const moves  = p.moves.slice(0,4).map(m => m.move.name).join(', ');
      return [`#${p.id} ${p.name.charAt(0).toUpperCase() + p.name.slice(1)}`,`Type: ${types}`,`Height: ${p.height/10}m  Weight: ${p.weight/10}kg`,`Base stats: ${stats}`,`Moves (first 4): ${moves}`].join('\n');
    } catch (e) {
      return `Pokédex error: ${e.message}`;
    }
  },
  async handle() {},
};
