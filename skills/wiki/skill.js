export default {
  tag: 'wiki',
  instruction: `WIKIPEDIA SKILL: For questions about people, places, events, or concepts, emit <wiki>Article Title</wiki> to get a real summary before answering.

Examples:
- "Who was Marie Curie?" → <wiki>Marie Curie</wiki>
- "What is quantum entanglement?" → <wiki>Quantum entanglement</wiki>`,
  async call(title) {
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.trim())}`);
      if (!res.ok) return `No Wikipedia article found for "${title}".`;
      const { extract } = await res.json();
      if (!extract) return 'No summary available.';
      return extract.length > 600 ? extract.slice(0, 597) + '…' : extract;
    } catch (e) {
      return `Wikipedia fetch failed: ${e.message}`;
    }
  },
  async handle() {},
};
