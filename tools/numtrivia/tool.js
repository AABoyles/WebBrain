export default {
  tag: 'numtrivia',
  instruction: `NUMBER TRIVIA SKILL: To get a fun fact about a number, call <|tool_call>call:numtrivia{input:<|"|>number<|"|>}<tool_call|> or <|tool_call>call:numtrivia{input:<|"|>year:number<|"|>}<tool_call|> for a year fact.

Examples:
- "Trivia about the number 42" → <|tool_call>call:numtrivia{input:<|"|>42<|"|>}<tool_call|>
- "What happened in 1969?" → <|tool_call>call:numtrivia{input:<|"|>year:1969<|"|>}<tool_call|>`,
  async call(content) {
    content = content.trim();
    const yearMatch = content.match(/^year:(\d+)$/i);
    try {
      let url;
      if (yearMatch) {
        url = `http://numbersapi.com/${yearMatch[1]}/year`;
      } else {
        const n = parseInt(content);
        if (isNaN(n)) return 'Enter a number or year:YYYY';
        url = `http://numbersapi.com/${n}`;
      }
      const res = await fetch(url);
      if (!res.ok) return 'Numbers API unavailable.';
      return await res.text();
    } catch (e) {
      return `Number trivia error: ${e.message}`;
    }
  },
  async handle() {},
};
