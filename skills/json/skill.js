export default {
  tag: 'json',
  instruction: `JSON FORMATTER SKILL: To pretty-print or minify JSON, emit <json>json string</json> to pretty-print, or <json>minify:json string</json> to minify.

Examples:
- "Format this JSON: {\"a\":1,\"b\":2}" → <json>{"a":1,"b":2}</json>
- "Minify this JSON" → <json>minify:{ "a": 1, "b": 2 }</json>`,
  call(content) {
    const minify = content.toLowerCase().startsWith('minify:');
    const raw = minify ? content.slice(7).trim() : content.trim();
    try {
      const parsed = JSON.parse(raw);
      return minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
    } catch (e) {
      return `Invalid JSON: ${e.message}`;
    }
  },
  async handle() {},
};
