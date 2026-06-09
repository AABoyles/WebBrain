export default {
  tag: 'countdown',
  instruction: `COUNTDOWN SKILL: To calculate time remaining until a date or event, call <|tool_call>call:countdown{input:<|"|>target date<|"|>}<tool_call|>.

Examples:
- "How long until Christmas?" → <|tool_call>call:countdown{input:<|"|>December 25, 2025<|"|>}<tool_call|>
- "Days until New Year's" → <|tool_call>call:countdown{input:<|"|>January 1, 2026<|"|>}<tool_call|>
- "Countdown to July 4" → <|tool_call>call:countdown{input:<|"|>July 4, 2025<|"|>}<tool_call|>`,
  call(content) {
    const target = new Date(content.trim());
    if (isNaN(target.getTime())) return `Cannot parse date: "${content}"`;
    const now  = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff < 0) {
      const past = Math.abs(diff);
      const d = Math.floor(past / 86400000);
      return `That date was ${d} day${d !== 1 ? 's' : ''} ago.`;
    }
    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const parts = [];
    if (days)    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours)   parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes && days < 7) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    return parts.join(', ') + ' remaining.';
  },
  async handle() {},
};
