const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default {
  tag: 'dayofweek',
  instruction: `DAY OF WEEK SKILL: To find what day of the week any date falls on, emit <dayofweek>date</dayofweek>. Accepts any date string.

Examples:
- "What day was July 4, 1776?" → <dayofweek>July 4, 1776</dayofweek>
- "What day is Christmas 2030?" → <dayofweek>December 25, 2030</dayofweek>
- "Day of week for 2001-09-11" → <dayofweek>2001-09-11</dayofweek>`,
  call(content) {
    const d = new Date(content.trim());
    if (isNaN(d.getTime())) return `Cannot parse date: "${content}". Try "July 4, 1776" or "2030-12-25".`;
    const day = DAYS[d.getUTCDay()];
    const formatted = d.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
    return `${formatted} was a ${day}.`;
  },
  async handle() {},
};
