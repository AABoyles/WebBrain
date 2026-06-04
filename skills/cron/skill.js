const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Expand a cron field string to a Set of integers
function expandField(field, lo, hi) {
  const vals = new Set();
  for (const part of field.split(',')) {
    if (part === '*') {
      for (let i = lo; i <= hi; i++) vals.add(i);
    } else if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2));
      for (let i = lo; i <= hi; i += step) vals.add(i);
    } else if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      for (let i = a; i <= b; i++) vals.add(i);
    } else {
      const n = parseInt(part);
      if (!isNaN(n)) vals.add(n);
    }
  }
  return vals;
}

// Human-readable description of a single field
function describeField(val, type) {
  if (val === '*') return null;
  if (val.startsWith('*/')) return `every ${val.slice(2)} ${type}(s)`;
  if (val.includes('-')) {
    const [a, b] = val.split('-');
    if (type === 'dow') return `${DAYS[+a]} through ${DAYS[+b]}`;
    if (type === 'month') return `${MONTHS[+a-1]} through ${MONTHS[+b-1]}`;
    return `${a} through ${b}`;
  }
  if (val.includes(',')) {
    const parts = val.split(',');
    if (type === 'dow')   return parts.map(p => DAYS[+p]).join(', ');
    if (type === 'month') return parts.map(p => MONTHS[+p-1]).join(', ');
    return parts.join(', ');
  }
  if (type === 'dow')   return DAYS[+val]   ?? val;
  if (type === 'month') return MONTHS[+val-1] ?? val;
  return val;
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// Generate human-readable description (cronstrue-style)
function describe(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, dom, month, dow] = parts;

  if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*')
    return 'Every minute';

  // Time portion
  let timeStr;
  const isSimpleMin  = /^\d+$/.test(min);
  const isSimpleHour = /^\d+$/.test(hour);
  if (min.startsWith('*/') && hour === '*') {
    timeStr = `every ${min.slice(2)} minutes`;
  } else if (hour.startsWith('*/') && min === '0') {
    timeStr = `every ${hour.slice(2)} hours, on the hour`;
  } else if (isSimpleMin && isSimpleHour) {
    timeStr = `at ${hour.padStart(2,'0')}:${min.padStart(2,'0')}`;
  } else if (isSimpleMin && hour === '*') {
    timeStr = `at minute ${min} of every hour`;
  } else {
    const md = describeField(min, 'minute') ?? 'every minute';
    const hd = describeField(hour, 'hour')  ?? 'every hour';
    timeStr = `at minute ${md} of ${hd === 'every minute' ? 'every hour' : `hour ${hd}`}`;
  }

  // Day portion
  const domWild = dom === '*', dowWild = dow === '*';
  let dayStr;
  if (domWild && dowWild) {
    dayStr = 'every day';
  } else if (!domWild && dowWild) {
    const d = describeField(dom, 'dom');
    dayStr = `on the ${ordinal(parseInt(dom))} of the month`;
    if (dom.includes(',') || dom.includes('-')) dayStr = `on day-of-month ${d}`;
  } else if (domWild && !dowWild) {
    dayStr = `on ${describeField(dow, 'dow')}`;
  } else {
    dayStr = `on day-of-month ${describeField(dom,'dom')} or ${describeField(dow,'dow')}`;
  }

  // Month portion
  const monthStr = month === '*' ? '' : ` in ${describeField(month, 'month')}`;

  const full = `${timeStr.charAt(0).toUpperCase() + timeStr.slice(1)}, ${dayStr}${monthStr}`;
  return full.replace(/, every day$/, ' every day');
}

// Compute next N run times starting after `from` (defaults to now)
function nextRuns(expr, count = 5, from = new Date()) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minF, hourF, domF, monthF, dowF] = parts;
  const mins   = expandField(minF,   0, 59);
  const hours  = expandField(hourF,  0, 23);
  const doms   = expandField(domF,   1, 31);
  const months = expandField(monthF, 1, 12);
  const dows   = expandField(dowF,   0,  6);
  const domWild = domF === '*', dowWild = dowF === '*';

  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const results = [];
  const limit = 366 * 24 * 60; // 1 year of minutes max
  for (let i = 0; i < limit && results.length < count; i++) {
    const month = cursor.getMonth() + 1;
    const dom   = cursor.getDate();
    const dow   = cursor.getDay();
    const hour  = cursor.getHours();
    const min   = cursor.getMinutes();

    const dayMatch = domWild && dowWild ? true
      : !domWild && !dowWild ? (doms.has(dom) || dows.has(dow))
      : domWild ? dows.has(dow)
      : doms.has(dom);

    if (months.has(month) && dayMatch && hours.has(hour) && mins.has(min))
      results.push(new Date(cursor));

    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return results;
}

export default {
  tag: 'cron',
  instruction: `CRON EXPRESSION SKILL: To explain a cron schedule and show next run times, emit <cron>expression</cron>. Optionally prefix with a count: <cron>10:0 9 * * 1</cron> to show next 10 runs. Supports 5-field cron (min hour dom month dow).

Examples:
- "What does '0 9 * * 1' mean?" → <cron>0 9 * * 1</cron>
- "Next 10 runs of '*/15 * * * *'" → <cron>10:*/15 * * * *</cron>`,
  call(content) {
    content = content.trim();
    let count = 5;
    const countMatch = content.match(/^(\d+):/);
    if (countMatch) {
      count   = Math.min(parseInt(countMatch[1]), 20);
      content = content.slice(countMatch[0].length);
    }

    const parts = content.split(/\s+/);
    if (parts.length !== 5) return 'Cron expressions have 5 fields: minute hour day-of-month month day-of-week';

    const human = describe(content);
    const runs  = nextRuns(content, count);

    const lines = [];
    if (human) lines.push(`Schedule: ${human}`);
    lines.push(`Expression: ${content}`);
    if (runs && runs.length) {
      lines.push('', `Next ${runs.length} run${runs.length > 1 ? 's' : ''}:`);
      lines.push(...runs.map(d => `  ${d.toLocaleString()}`));
    } else {
      lines.push('(No runs found in the next year)');
    }
    return lines.join('\n');
  },
  async handle() {},
};
