// Date arithmetic: add/subtract durations, find difference, relative expressions
const UNITS = {
  year: 365.25, years: 365.25, yr: 365.25, y: 365.25,
  month: 30.4375, months: 30.4375, mo: 30.4375,
  week: 7, weeks: 7, wk: 7, w: 7,
  day: 1, days: 1, d: 1,
  hour: 1/24, hours: 1/24, hr: 1/24, h: 1/24,
  minute: 1/1440, minutes: 1/1440, min: 1/1440,
  second: 1/86400, seconds: 1/86400, sec: 1/86400, s: 1/86400,
};

function parseDuration(str) {
  // e.g. "3 weeks", "2 days and 4 hours", "1 year 6 months"
  let totalDays = 0;
  const re = /(\d+(?:\.\d+)?)\s*(years?|months?|weeks?|days?|hours?|minutes?|seconds?|yrs?|wks?|mo|hr|min|sec|[ymwdhs])\b/gi;
  let m;
  while ((m = re.exec(str)) !== null) {
    const amount = parseFloat(m[1]);
    const unit   = m[2].toLowerCase();
    if (UNITS[unit] !== undefined) totalDays += amount * UNITS[unit];
  }
  return totalDays;
}

function parseDate(str) {
  str = str.trim().toLowerCase();
  if (str === 'today' || str === 'now') return new Date();
  if (str === 'yesterday') { const d = new Date(); d.setDate(d.getDate() - 1); return d; }
  if (str === 'tomorrow')  { const d = new Date(); d.setDate(d.getDate() + 1); return d; }
  // Parse YYYY-MM-DD as local date to avoid UTC midnight offset bug
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function humanDiff(days) {
  const abs = Math.abs(days);
  if (abs < 1)       return `${Math.round(abs * 24)} hour(s)`;
  if (abs < 7)       return `${Math.round(abs)} day(s)`;
  if (abs < 30)      return `${Math.round(abs / 7)} week(s)`;
  if (abs < 365)     return `${Math.round(abs / 30.4375)} month(s)`;
  const y = Math.floor(abs / 365.25);
  const rem = Math.round((abs - y * 365.25) / 30.4375);
  return rem > 0 ? `${y} year(s) and ${rem} month(s)` : `${y} year(s)`;
}

export default {
  tag: 'datemath',
  instruction: `DATE ARITHMETIC SKILL: Perform date calculations. call <|tool_call>call:datemath{input:<|"|>expression<|"|>}<tool_call|>.
Expressions:
 - "today + 3 weeks"
 - "2024-01-15 + 6 months"
 - "days between 2020-01-01 and 2024-06-01"
 - "2025-12-25 - today"

Examples:
- "What date is 90 days from now?" → <|tool_call>call:datemath{input:<|"|>today + 90 days<|"|>}<tool_call|>
- "Days until Christmas 2025" → <|tool_call>call:datemath{input:<|"|>days between today and 2025-12-25<|"|>}<tool_call|>`,
  call(content) {
    const s = content.trim();

    // "days between X and Y" or "X to Y"
    const betweenMatch = s.match(/(?:days?\s+(?:between|from|until|to))\s+(.+?)\s+(?:and|to)\s+(.+)/i)
                      ?? s.match(/^(.+?)\s+to\s+(.+)$/i);
    if (betweenMatch) {
      const d1 = parseDate(betweenMatch[1]);
      const d2 = parseDate(betweenMatch[2]);
      if (!d1) return `Could not parse date: "${betweenMatch[1]}"`;
      if (!d2) return `Could not parse date: "${betweenMatch[2]}"`;
      const diff = (d2 - d1) / 86400000;
      const sign = diff >= 0 ? '' : '-';
      return [
        `From: ${formatDate(d1)}`,
        `To:   ${formatDate(d2)}`,
        `Diff: ${sign}${humanDiff(diff)} (${Math.abs(Math.round(diff))} days)`,
      ].join('\n');
    }

    // "date +/- duration" — require spaces around operator to avoid YYYY-MM-DD splitting
    const arithMatch = s.match(/^(.+?)\s+([+-])\s+(.+)$/);
    if (arithMatch) {
      const base = parseDate(arithMatch[1]);
      if (!base) return `Could not parse date: "${arithMatch[1]}"`;
      const op   = arithMatch[2];
      const days = parseDuration(arithMatch[3]);
      if (!days && days !== 0) return `Could not parse duration: "${arithMatch[3]}"`;
      const result = new Date(base.getTime() + (op === '+' ? days : -days) * 86400000);
      return [
        `Base:   ${formatDate(base)}`,
        `${op === '+' ? 'Add' : 'Sub'}: ${humanDiff(days)} (${Math.round(days)} days)`,
        `Result: ${formatDate(result)}`,
      ].join('\n');
    }

    return 'Format: "today + 3 weeks", "days between 2020-01-01 and 2024-06-01", or "2025-12-25 - today"';
  },
  async handle() {},
};
