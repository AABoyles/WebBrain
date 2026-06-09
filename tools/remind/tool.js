function parseDelay(str) {
  let ms = 0;
  for (const [, n, unit] of str.matchAll(/(\d+(?:\.\d+)?)\s*(h|m|s)/gi)) {
    switch (unit.toLowerCase()) {
      case 'h': ms += parseFloat(n) * 3_600_000; break;
      case 'm': ms += parseFloat(n) * 60_000;    break;
      case 's': ms += parseFloat(n) * 1_000;     break;
    }
  }
  return ms || null;
}

export default {
  tag: 'remind',
  instruction: `REMINDER SKILL: When asked to be reminded of something, call <|tool_call>call:remind{input:<|"|>delay:message<|"|>}<tool_call|> AFTER your natural reply. Delay uses h/m/s (e.g. "20m", "1h", "1h30m").

Examples:
- "Remind me in 20 min to check the oven" → Sure! I'll alert you in 20 minutes. <|tool_call>call:remind{input:<|"|>20m:Check the oven<|"|>}<tool_call|>
- "Set an alarm for 2 hours" → Done. <|tool_call>call:remind{input:<|"|>2h:Your alarm<|"|>}<tool_call|>`,
  async handle(content) {
    const m = content.match(/^([^:]+):(.+)$/s);
    if (!m) return;
    const ms = parseDelay(m[1].trim());
    if (!ms) return;
    const message = m[2].trim();
    if (Notification.permission === 'default') await Notification.requestPermission();
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('WebBrain Reminder', { body: message });
      } else {
        alert('Reminder: ' + message);
      }
    }, ms);
  },
};
