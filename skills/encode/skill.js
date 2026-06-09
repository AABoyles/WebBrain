const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const HTML_UNE = Object.fromEntries(Object.entries(HTML_ESC).map(([k, v]) => [v, k]));

function encodeOp(mode, text) {
  switch (mode) {
    case 'base64':        return btoa(unescape(encodeURIComponent(text)));
    case 'decode:base64': return decodeURIComponent(escape(atob(text.trim())));
    case 'url':           return encodeURIComponent(text);
    case 'decode:url':    return decodeURIComponent(text);
    case 'html':          return text.replace(/[&<>"']/g, c => HTML_ESC[c]);
    case 'decode:html':   return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, e => HTML_UNE[e]);
    default:              return `Unknown mode "${mode}". Supported: base64, decode:base64, url, decode:url, html, decode:html`;
  }
}

export default {
  tag: 'encode',
  instruction: `ENCODE/DECODE SKILL: To encode or decode text, call <|tool_call>call:encode{input:<|"|>mode:text<|"|>}<tool_call|>.

Modes: base64, decode:base64, url, decode:url, html, decode:html

Examples:
- "Base64 encode 'hello world'" → <|tool_call>call:encode{input:<|"|>base64:hello world<|"|>}<tool_call|>
- "Decode aGVsbG8=" from base64 → <|tool_call>call:encode{input:<|"|>decode:base64:aGVsbG8=<|"|>}<tool_call|>
- "URL-encode this: /my path?q=hi" → <|tool_call>call:encode{input:<|"|>url:/my path?q=hi<|"|>}<tool_call|>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon === -1) return 'Format: mode:text — e.g. base64:hello';
    const mode = content.slice(0, colon).trim().toLowerCase();
    const text = content.slice(colon + 1);
    try {
      return encodeOp(mode, text);
    } catch (e) {
      return `Encode error: ${e.message}`;
    }
  },
  async handle() {},
};
