const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default {
  tag: 'dayofweek',
  instruction: `DAY OF WEEK SKILL: To find what day of the week any date falls on, call <|tool_call>call:dayofweek{input:<|"|>date<|"|>}<tool_call|>. Accepts any date string.

Examples:
- "What day was July 4, 1776?" → <|tool_call>call:dayofweek{input:<|"|>July 4, 1776<|"|>}<tool_call|>
- "What day is Christmas 2030?" → <|tool_call>call:dayofweek{input:<|"|>December 25, 2030<|"|>}<tool_call|>
- "Day of week for 2001-09-11" → <|tool_call>call:dayofweek{input:<|"|>2001-09-11<|"|>}<tool_call|>`,
  call(content) {
    const d = new Date(content.trim());
    if (isNaN(d.getTime())) return `Cannot parse date: "${content}". Try "July 4, 1776" or "2030-12-25".`;
    const day = DAYS[d.getUTCDay()];
    const formatted = d.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
    return `${formatted} was a ${day}.`;
  },
  async handle() {},
};
