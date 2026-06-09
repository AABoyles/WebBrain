const CYCLE_MIN  = 90;
const FALL_ASLEEP = 15; // average time to fall asleep in minutes

function fmt(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function parseTime(str) {
  str = str.trim().toLowerCase().replace(/\s+/g, '');
  const m12 = str.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  const m24  = str.match(/^(\d{1,2}):(\d{2})$/);
  const now  = new Date();
  if (m12) {
    let h = parseInt(m12[1]), m = parseInt(m12[2] ?? '0');
    if (/pm/.test(m12[3]) && h !== 12) h += 12;
    if (/am/.test(m12[3]) && h === 12) h = 0;
    const d = new Date(now); d.setHours(h, m, 0, 0);
    return d;
  }
  if (m24) {
    const d = new Date(now); d.setHours(parseInt(m24[1]), parseInt(m24[2]), 0, 0);
    return d;
  }
  return null;
}

export default {
  tag: 'sleep',
  instruction: `SLEEP CYCLE SKILL: To calculate optimal sleep times based on 90-minute REM cycles, call <|tool_call>call:sleep{input:<|"|>bedtime HH:MM<|"|>}<tool_call|> or <|tool_call>call:sleep{input:<|"|>wake HH:MM<|"|>}<tool_call|>.

Examples:
- "What time should I wake up if I sleep at 11pm?" → <|tool_call>call:sleep{input:<|"|>bedtime 11pm<|"|>}<tool_call|>
- "When should I go to bed to wake at 7am?" → <|tool_call>call:sleep{input:<|"|>wake 7am<|"|>}<tool_call|>`,
  call(content) {
    content = content.trim();
    const isWake = /^wake\s+/i.test(content);
    const timeStr = content.replace(/^(bedtime|wake)\s+/i, '');
    const time = parseTime(timeStr);
    if (!time) return 'Cannot parse time. Try "bedtime 11pm" or "wake 7:30am".';

    if (isWake) {
      // Work backwards: what bedtimes give 4–6 full cycles before wake time?
      const times = [];
      for (let cycles = 6; cycles >= 4; cycles--) {
        const bedMs = time.getTime() - (cycles * CYCLE_MIN + FALL_ASLEEP) * 60000;
        times.push({ cycles, time: new Date(bedMs) });
      }
      const lines = times.map(({ cycles, time: t }) =>
        `${fmt(t)} → ${cycles} cycles (${cycles * 1.5} hrs sleep)`
      );
      return `Bedtimes to wake at ${fmt(time)}:\n${lines.join('\n')}\n\nIncluding ~${FALL_ASLEEP} min to fall asleep.`;
    } else {
      // Forward: what wake times result from 4–6 cycles starting at bedtime?
      const asleep = new Date(time.getTime() + FALL_ASLEEP * 60000);
      const times = [];
      for (let cycles = 4; cycles <= 6; cycles++) {
        const wakeMs = asleep.getTime() + cycles * CYCLE_MIN * 60000;
        times.push({ cycles, time: new Date(wakeMs) });
      }
      const lines = times.map(({ cycles, time: t }) =>
        `${fmt(t)} → ${cycles} cycles (${cycles * 1.5} hrs sleep)`
      );
      return `Wake times if you sleep at ${fmt(time)}:\n${lines.join('\n')}\n\nIncluding ~${FALL_ASLEEP} min to fall asleep.`;
    }
  },
  async handle() {},
};
