function relTime(diffMs) {
  const abs = Math.abs(diffMs);
  const past = diffMs < 0;
  const s = Math.floor(abs / 1000);
  if (s < 60)   return past ? `${s}s ago` : `in ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)   return past ? `${m}m ago` : `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)   return past ? `${h}h ago` : `in ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 365)  return past ? `${d}d ago` : `in ${d}d`;
  const y = Math.floor(d / 365);
  return past ? `${y}y ago` : `in ${y}y`;
}

export default {
  tag: 'epoch',
  instruction: `UNIX TIMESTAMP SKILL: To convert a Unix timestamp to a human date, or a date to a Unix timestamp, call <|tool_call>call:epoch{input:<|"|>value<|"|>}<tool_call|>. Also shows relative time.

Examples:
- "What date is timestamp 1700000000?" → <|tool_call>call:epoch{input:<|"|>1700000000<|"|>}<tool_call|>
- "What's the Unix timestamp for Jan 1, 2030?" → <|tool_call>call:epoch{input:<|"|>January 1, 2030<|"|>}<tool_call|>
- "Current timestamp" → <|tool_call>call:epoch{input:<|"|>now<|"|>}<tool_call|>`,
  call(content) {
    content = content.trim();
    if (/^now$/i.test(content)) {
      const ts = Math.floor(Date.now() / 1000);
      return `Now: ${ts} (${new Date().toISOString()})`;
    }
    if (/^\d{9,13}$/.test(content)) {
      // Looks like a timestamp — auto-detect ms vs s
      const ms  = content.length >= 13 ? parseInt(content) : parseInt(content) * 1000;
      const d   = new Date(ms);
      const diff = ms - Date.now();
      return [
        `Unix: ${content}`,
        `UTC:  ${d.toUTCString()}`,
        `ISO:  ${d.toISOString()}`,
        `Local: ${d.toLocaleString()}`,
        `Relative: ${relTime(diff)}`,
      ].join('\n');
    }
    // Try to parse as a date string
    const d = new Date(content);
    if (isNaN(d.getTime())) return `Cannot parse "${content}". Try a timestamp (1700000000) or date string.`;
    const ts  = Math.floor(d.getTime() / 1000);
    const diff = d.getTime() - Date.now();
    return [
      `Date:  ${content}`,
      `Unix (seconds): ${ts}`,
      `Unix (ms):      ${d.getTime()}`,
      `ISO:   ${d.toISOString()}`,
      `Relative: ${relTime(diff)}`,
    ].join('\n');
  },
  async handle() {},
};
