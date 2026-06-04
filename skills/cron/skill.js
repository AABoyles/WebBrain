const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function describeField(val, type) {
  if (val === '*') return null; // "every"
  if (val.startsWith('*/')) return `every ${val.slice(2)} ${type}(s)`;
  if (val.includes('-')) {
    const [a, b] = val.split('-');
    if (type === 'day-of-week') return `${DAYS[+a]} through ${DAYS[+b]}`;
    if (type === 'month') return `${MONTHS[+a-1]} through ${MONTHS[+b-1]}`;
    return `${a} through ${b}`;
  }
  if (val.includes(',')) {
    const parts = val.split(',');
    if (type === 'day-of-week') return parts.map(p => DAYS[+p]).join(', ');
    if (type === 'month') return parts.map(p => MONTHS[+p-1]).join(', ');
    return parts.join(', ');
  }
  if (type === 'day-of-week') return DAYS[+val] ?? val;
  if (type === 'month') return MONTHS[+val - 1] ?? val;
  return val;
}

export default {
  tag: 'cron',
  instruction: `CRON EXPRESSION SKILL: To explain a cron schedule expression in plain English, emit <cron>expression</cron>. Supports standard 5-field cron (min hour dom month dow).

Examples:
- "What does '0 9 * * 1' mean?" → <cron>0 9 * * 1</cron>
- "Explain '*/15 * * * *'" → <cron>*/15 * * * *</cron>`,
  call(content) {
    const parts = content.trim().split(/\s+/);
    if (parts.length !== 5) return 'Cron expressions have 5 fields: minute hour day-of-month month day-of-week';
    const [min, hour, dom, month, dow] = parts;
    const lines = ['At:'];
    const minDesc   = describeField(min,   'minute');
    const hourDesc  = describeField(hour,  'hour');
    const domDesc   = describeField(dom,   'day');
    const monthDesc = describeField(month, 'month');
    const dowDesc   = describeField(dow,   'day-of-week');

    if (min === '0' && hour !== '*') {
      lines.push(`  ${hourDesc === null ? 'every hour' : `${hour}:00`}`);
    } else {
      if (minDesc)  lines.push(`  Minute: ${minDesc}`);
      else          lines.push(`  Minute: every minute`);
      if (hourDesc) lines.push(`  Hour: ${hourDesc}`);
      else          lines.push(`  Hour: every hour`);
    }
    if (domDesc)   lines.push(`  Day of month: ${domDesc}`);
    if (monthDesc) lines.push(`  Month: ${monthDesc}`);
    if (dowDesc)   lines.push(`  Day of week: ${dowDesc}`);

    // Common patterns
    if (min === '0' && hour !== '*' && dom === '*' && month === '*' && dow === '*') {
      return `Every day at ${hour.padStart(2,'0')}:00`;
    }
    if (min === '0' && hour !== '*' && dom === '*' && month === '*' && dow !== '*') {
      return `Every ${dowDesc} at ${hour.padStart(2,'0')}:00`;
    }
    if (min === '0' && hour === '0' && dom === '*' && month === '*' && dow === '*') {
      return 'Every day at midnight (00:00)';
    }

    return lines.join('\n') + `\n\nRaw: ${content.trim()}`;
  },
  async handle() {},
};
