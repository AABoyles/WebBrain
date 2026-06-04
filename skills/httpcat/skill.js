const DESCRIPTIONS = {
  100:'A cat that isn\'t sure what\'s happening yet — sitting at attention.',
  200:'A very happy cat — purring contentedly.',
  201:'A kitten was just born, or a cat proudly deposited a "gift".',
  204:'An empty cat bowl. No content.',
  301:'A cat that has permanently moved to a new sofa.',
  302:'A cat temporarily sitting somewhere it\'s not supposed to.',
  304:'A cat that hasn\'t moved from its spot since last time you checked.',
  400:'A confused cat — something about your request makes no sense.',
  401:'A cat blocking the doorway: "You shall not pass without credentials."',
  403:'A cat sitting on your laptop: access firmly denied.',
  404:'You left a cat in a room and it has completely vanished.',
  405:'A cat ignoring the request — that\'s not how you pet a cat.',
  408:'A cat that fell asleep waiting for you to do something.',
  409:'Two cats fighting over the same spot — conflict detected.',
  410:'A cat that used to live here. It is gone now.',
  413:'A very large cat that doesn\'t fit in the carrier.',
  418:'A cat sitting in a teapot. ☕🐱',
  429:'Too many cat photos sent at once.',
  451:'A cat that has been legally prohibited from certain rooms.',
  500:'A cat that knocked something off the shelf and now looks very guilty.',
  502:'A cat passed a message to another cat who then ate it.',
  503:'The cat is unavailable — napping, hunting, or simply uninterested.',
  504:'The cat was supposed to bring a message; it got distracted by a bird.',
};

const HTTP_NAMES = {
  100:'Continue',200:'OK',201:'Created',204:'No Content',301:'Moved Permanently',
  302:'Found',304:'Not Modified',400:'Bad Request',401:'Unauthorized',403:'Forbidden',
  404:'Not Found',405:'Method Not Allowed',408:'Request Timeout',409:'Conflict',
  410:'Gone',413:'Content Too Large',418:"I'm a Teapot",429:'Too Many Requests',
  451:'Unavailable For Legal Reasons',500:'Internal Server Error',502:'Bad Gateway',
  503:'Service Unavailable',504:'Gateway Timeout',
};

export default {
  tag: 'httpcat',
  instruction: `HTTP CATS SKILL: For a fun cat-based description of an HTTP status code, emit <httpcat>code</httpcat>.

Examples:
- "HTTP cat for 404" → <httpcat>404</httpcat>
- "418 cat" → <httpcat>418</httpcat>`,
  call(content) {
    const code = parseInt(content.trim());
    const name = HTTP_NAMES[code];
    const desc = DESCRIPTIONS[code];
    if (!name && !desc) return `No cat for HTTP ${code}. Try 200, 404, 418, 500, etc.`;
    return `HTTP ${code}${name ? ` ${name}` : ''}: ${desc ?? 'A cat representing this code.'}`;
  },
  async handle() {},
};
