function wallClockAsUTC(tz, date) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(date);
  const get = t => parseInt(p.find(x => x.type === t)?.value ?? '0');
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
}

function parseTime(str) {
  str = str.trim().replace(/\s+/g, '');
  const m12 = str.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
  const m24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (m12) {
    let h = parseInt(m12[1]), m = parseInt(m12[2] ?? '0');
    if (/pm/i.test(m12[3]) && h !== 12) h += 12;
    if (/am/i.test(m12[3]) && h === 12) h = 0;
    return { h, m };
  }
  if (m24) return { h: parseInt(m24[1]), m: parseInt(m24[2]) };
  return null;
}

export default {
  tag: 'tz',
  instruction: `TIMEZONE CONVERTER SKILL: For timezone questions, call <|tool_call>call:tz{input:<|"|>expression<|"|>}<tool_call|> using IANA timezone names.

Formats:
- "now in Timezone" → current time in that zone
- "3pm From/Zone to To/Zone" → convert a specific time

Examples:
- "What time is it in Tokyo?" → <|tool_call>call:tz{input:<|"|>now in Asia/Tokyo<|"|>}<tool_call|>
- "3pm New York in London" → <|tool_call>call:tz{input:<|"|>3pm America/New_York to Europe/London<|"|>}<tool_call|>
- "Convert 14:30 Berlin to LA" → <|tool_call>call:tz{input:<|"|>14:30 Europe/Berlin to America/Los_Angeles<|"|>}<tool_call|>`,
  call(input) {
    input = input.trim();
    try {
      const nowM = input.match(/^now\s+in\s+(.+)$/i);
      if (nowM) {
        const tz = nowM[1].trim();
        return new Intl.DateTimeFormat('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' }).format(new Date());
      }

      const convM = input.match(/^(.+?)\s+([\w/]+)\s+to\s+([\w/]+)$/i);
      if (convM) {
        const parsed = parseTime(convM[1]);
        const fromTz = convM[2];
        const toTz   = convM[3];
        if (!parsed) return `Cannot parse time: "${convM[1]}"`;

        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: fromTz }).format(new Date());
        const naiveUTC = new Date(`${todayStr}T${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}:00Z`);
        const wall     = wallClockAsUTC(fromTz, naiveUTC);
        const utcDate  = new Date(2 * naiveUTC.getTime() - wall);

        return new Intl.DateTimeFormat('en-US', {
          timeZone: toTz, hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        }).format(utcDate);
      }

      return 'Format: "now in Asia/Tokyo" or "3pm America/New_York to Europe/London"';
    } catch (e) {
      return `Timezone error: ${e.message}`;
    }
  },
  async handle() {},
};
