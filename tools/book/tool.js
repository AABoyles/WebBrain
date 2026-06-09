export default {
  tag: 'book',
  instruction: `OPEN LIBRARY SKILL: To search for a book by title or author, call <|tool_call>call:book{input:<|"|>query<|"|>}<tool_call|>. Returns the top result with year, author, and description.

Examples:
- "Find books about Dune" → <|tool_call>call:book{input:<|"|>Dune Frank Herbert<|"|>}<tool_call|>
- "Look up 1984 by Orwell" → <|tool_call>call:book{input:<|"|>1984 Orwell<|"|>}<tool_call|>`,
  async call(query) {
    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}&limit=3&fields=title,author_name,first_publish_year,key`;
      const res = await fetch(url);
      if (!res.ok) return 'Open Library search failed.';
      const { docs } = await res.json();
      if (!docs?.length) return `No books found for "${query}".`;
      return docs.map(d => [
        `"${d.title}"`,
        d.author_name?.length ? `by ${d.author_name.slice(0,2).join(', ')}` : '',
        d.first_publish_year ? `(${d.first_publish_year})` : '',
      ].filter(Boolean).join(' ')).join('\n');
    } catch (e) {
      return `Book search error: ${e.message}`;
    }
  },
  async handle() {},
};
