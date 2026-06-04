const HOURS = ['midnight','one','two','three','four','five','six','seven','eight','nine','ten','eleven','noon',
  'one','two','three','four','five','six','seven','eight','nine','ten','eleven'];

export default {
  tag: 'poetictime',
  instruction: `POETIC TIME SKILL: When asked for the time in a whimsical or poetic way, emit <poetictime></poetictime> (empty tag).

Examples:
- "What time is it poetically?" → <poetictime></poetictime>
- "Tell me the time like a poet" → <poetictime></poetictime>`,
  call() {
    const now = new Date();
    const h   = now.getHours();
    const m   = now.getMinutes();
    const ampm = h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'at night';

    if (m === 0)  return `The stroke of ${HOURS[h]}${h === 0 || h === 12 ? '' : ' ' + ampm}.`;
    if (m === 30) return `Half past ${HOURS[h]} ${ampm}.`;
    if (m === 15) return `Quarter past ${HOURS[h]} ${ampm}.`;
    if (m === 45) return `Quarter to ${HOURS[(h + 1) % 24]} ${ampm}.`;
    if (m < 30)   return `${m} minute${m !== 1 ? 's' : ''} past ${HOURS[h]} ${ampm}.`;
    return `${60 - m} minute${60 - m !== 1 ? 's' : ''} to ${HOURS[(h + 1) % 24]} ${ampm}.`;
  },
  async handle() {},
};
