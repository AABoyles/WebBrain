export default {
  tag: 'define',
  instruction: `DICTIONARY SKILL: To look up a word definition, emit <define>word</define>. Uses the Free Dictionary API (no key required).

Examples:
- "Define 'ephemeral'" → <define>ephemeral</define>
- "What does 'serendipity' mean?" → <define>serendipity</define>`,
  async call(word) {
    word = word.trim().toLowerCase();
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) return `No definition found for "${word}".`;
      const [entry] = await res.json();
      const lines = [`**${entry.word}**`];
      if (entry.phonetics?.find(p => p.text)) lines.push(entry.phonetics.find(p => p.text).text);
      for (const meaning of entry.meanings.slice(0, 3)) {
        lines.push(`\n${meaning.partOfSpeech}:`);
        for (const def of meaning.definitions.slice(0, 2)) {
          lines.push(`  • ${def.definition}`);
          if (def.example) lines.push(`    e.g. "${def.example}"`);
        }
      }
      return lines.join('\n');
    } catch (e) {
      return `Dictionary error: ${e.message}`;
    }
  },
  async handle() {},
};
