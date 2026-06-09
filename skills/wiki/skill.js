export default {
  tag: 'wiki',
  instruction: `WIKIPEDIA SKILL: For questions about people, places, events, or concepts, call <|tool_call>call:wiki{input:<|"|>Article Title<|"|>}<tool_call|> to get a real summary before answering.

Examples:
- "Who was Marie Curie?" → <|tool_call>call:wiki{input:<|"|>Marie Curie<|"|>}<tool_call|>
- "What is quantum entanglement?" → <|tool_call>call:wiki{input:<|"|>Quantum entanglement<|"|>}<tool_call|>`,
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
