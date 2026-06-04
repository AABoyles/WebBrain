export default {
  tag: 'date',
  instruction: `DATE SKILL: When the user asks about the current date, time, day of the week, or anything time-dependent, emit <date></date> in your reply and stop. Do not guess the date.

Examples:
- "What's today's date?" → "Today is <date></date>."
- "What time is it?" → "The current time is <date></date>."`,
  call:    () => new Date().toLocaleString(),
  replace: () => new Date().toLocaleString(),
  async handle() {},
};
