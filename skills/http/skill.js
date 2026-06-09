const STATUS = {
  100:'Continue',101:'Switching Protocols',102:'Processing',103:'Early Hints',
  200:'OK',201:'Created',202:'Accepted',203:'Non-Authoritative Information',
  204:'No Content',205:'Reset Content',206:'Partial Content',207:'Multi-Status',
  208:'Already Reported',226:'IM Used',
  300:'Multiple Choices',301:'Moved Permanently',302:'Found',303:'See Other',
  304:'Not Modified',305:'Use Proxy',307:'Temporary Redirect',308:'Permanent Redirect',
  400:'Bad Request',401:'Unauthorized',402:'Payment Required',403:'Forbidden',
  404:'Not Found',405:'Method Not Allowed',406:'Not Acceptable',
  407:'Proxy Authentication Required',408:'Request Timeout',409:'Conflict',
  410:'Gone',411:'Length Required',412:'Precondition Failed',413:'Content Too Large',
  414:'URI Too Long',415:'Unsupported Media Type',416:'Range Not Satisfiable',
  417:'Expectation Failed',418:"I'm a Teapot (RFC 2324)",421:'Misdirected Request',
  422:'Unprocessable Content',423:'Locked',424:'Failed Dependency',425:'Too Early',
  426:'Upgrade Required',428:'Precondition Required',429:'Too Many Requests',
  431:'Request Header Fields Too Large',451:'Unavailable For Legal Reasons',
  499:'Client Closed Request (nginx)',
  500:'Internal Server Error',501:'Not Implemented',502:'Bad Gateway',
  503:'Service Unavailable',504:'Gateway Timeout',505:'HTTP Version Not Supported',
  506:'Variant Also Negotiates',507:'Insufficient Storage',508:'Loop Detected',
  510:'Not Extended',511:'Network Authentication Required',
  520:'Web Server Returned an Unknown Error (Cloudflare)',
  521:'Web Server Is Down (Cloudflare)',522:'Connection Timed Out (Cloudflare)',
  523:'Origin Is Unreachable (Cloudflare)',524:'A Timeout Occurred (Cloudflare)',
  525:'SSL Handshake Failed (Cloudflare)',526:'Invalid SSL Certificate (Cloudflare)',
};

const CLASSES = {1:'Informational',2:'Success',3:'Redirection',4:'Client Error',5:'Server Error'};

export default {
  tag: 'http',
  instruction: `HTTP STATUS SKILL: To look up an HTTP status code, call <|tool_call>call:http{input:<|"|>code<|"|>}<tool_call|>.

Examples:
- "What is HTTP 418?" → <|tool_call>call:http{input:<|"|>418<|"|>}<tool_call|>
- "Explain 503" → <|tool_call>call:http{input:<|"|>503<|"|>}<tool_call|>`,
  call(content) {
    const code = parseInt(content.trim());
    if (isNaN(code) || code < 100 || code > 599) return 'Enter an HTTP status code (100–599).';
    const name  = STATUS[code] ?? 'Non-standard / vendor-specific';
    const cls   = CLASSES[Math.floor(code / 100)] ?? 'Unknown';
    return `${code} ${name}\nClass: ${Math.floor(code/100)}xx — ${cls}`;
  },
  async handle() {},
};
