function bar(pct, width = 20) {
  const filled = Math.round(pct / 100 * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}

export default {
  tag: 'daypct',
  instruction: `DAY PROGRESS SKILL: To show how much of the day, week, or year has elapsed, call <|tool_call>call:daypct{input:<|"|><|"|>}<tool_call|> (empty tag).

Example: "How far through the year are we?" → <|tool_call>call:daypct{input:<|"|><|"|>}<tool_call|>`,
  call() {
    const now   = new Date();
    const dayMs  = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
    const dayPct = (dayMs / 86400000 * 100).toFixed(1);

    const dow    = now.getDay(); // 0=Sun
    const weekMs = dow * 86400000 + dayMs;
    const weekPct = (weekMs / (7 * 86400000) * 100).toFixed(1);

    const start  = new Date(now.getFullYear(), 0, 1);
    const end    = new Date(now.getFullYear() + 1, 0, 1);
    const yearPct = ((now - start) / (end - start) * 100).toFixed(1);

    return [
      `Day:  ${dayPct}% ${bar(parseFloat(dayPct))}`,
      `Week: ${weekPct}% ${bar(parseFloat(weekPct))}`,
      `Year: ${yearPct}% ${bar(parseFloat(yearPct))}`,
    ].join('\n');
  },
  async handle() {},
};
