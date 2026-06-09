import { getHabits, logHabit } from '../db.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function streak(logs) {
  // logs: array of date strings 'YYYY-MM-DD', may have duplicates
  const days = [...new Set(logs)].sort().reverse();
  let streak = 0;
  let cursor = today();
  for (const day of days) {
    if (day === cursor) { streak++; cursor = prevDay(cursor); }
    else if (day < cursor) break;
  }
  return streak;
}

function prevDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default {
  tag: 'habit',
  instruction: `HABIT TRACKER SKILL: To log a habit as done today, call <|tool_call>call:habit{input:<|"|>log:habit name<|"|>}<tool_call|>. To see streaks and history, call <|tool_call>call:habit{input:<|"|>stats:habit name<|"|>}<tool_call|> or <|tool_call>call:habit{input:<|"|>list<|"|>}<tool_call|> for all habits.

Examples:
- "I exercised today" → <|tool_call>call:habit{input:<|"|>log:exercise<|"|>}<tool_call|>
- "Did my morning meditation" → <|tool_call>call:habit{input:<|"|>log:meditation<|"|>}<tool_call|>
- "Show my exercise streak" → <|tool_call>call:habit{input:<|"|>stats:exercise<|"|>}<tool_call|>`,
  async call(content) {
    const cmd = content.trim();

    if (cmd === 'list') {
      const all = await getHabits();
      if (!all.length) return 'No habits logged yet.';
      const byName = {};
      for (const h of all) {
        byName[h.name] = byName[h.name] ?? [];
        byName[h.name].push(h.date);
      }
      return Object.entries(byName).map(([name, dates]) =>
        `${name}: ${streak(dates)}-day streak, ${dates.length} total`
      ).join('\n');
    }

    if (cmd.startsWith('stats:')) {
      const name = cmd.slice(6).trim().toLowerCase();
      const all  = await getHabits();
      const logs  = all.filter(h => h.name === name).map(h => h.date);
      if (!logs.length) return `No logs for "${name}" yet.`;
      const s    = streak(logs);
      return `${name}: ${s}-day streak, ${logs.length} total logs, last: ${logs.sort().reverse()[0]}`;
    }

    if (cmd.startsWith('log:')) {
      const name = cmd.slice(4).trim().toLowerCase();
      await logHabit(name);
      const all  = await getHabits();
      const s    = streak(all.filter(h => h.name === name).map(h => h.date));
      return `Logged "${name}" for today. Current streak: ${s} day${s !== 1 ? 's' : ''}.`;
    }

    return 'Commands: log:name, stats:name, list';
  },
  async handle() {},
};
