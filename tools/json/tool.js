export default {
  tag: 'json',
  instruction: `JSON FORMATTER SKILL: To pretty-print or minify JSON, call <|tool_call>call:json{input:<|"|>json string<|"|>}<tool_call|> to pretty-print, or <|tool_call>call:json{input:<|"|>minify:json string<|"|>}<tool_call|> to minify.

Examples:
- "Format this JSON: {\"a\":1,\"b\":2}" → <|tool_call>call:json{input:<|"|>{"a":1,"b":2}<|"|>}<tool_call|>
- "Minify this JSON" → <|tool_call>call:json{input:<|"|>minify:{ "a": 1, "b": 2 }<|"|>}<tool_call|>`,
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
