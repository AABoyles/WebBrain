// Indent XML using simple string manipulation (no DOM needed for formatting)
function indentXml(xml) {
  let indent = 0;
  return xml
    .replace(/>\s*</g, '><')
    .replace(/(<\/[^>]+>|<[^/>]+\/>)/g, m => m)
    .split(/(<[^>]+>)/)
    .filter(Boolean)
    .map(token => {
      if (/^<\//.test(token)) indent--;
      const line = '  '.repeat(Math.max(0, indent)) + token;
      if (/^<[^/!?][^>]*[^/]>$/.test(token)) indent++;
      return line;
    })
    .join('\n')
    .replace(/\n+/g, '\n');
}

// XML node → plain JS object
function nodeToObj(node) {
  if (node.nodeType === 3) {   // text
    const t = node.nodeValue.trim();
    return t || undefined;
  }
  if (node.nodeType !== 1) return undefined; // skip comments etc.

  const obj = {};
  // Attributes
  for (const attr of node.attributes ?? []) {
    obj[`@${attr.name}`] = attr.value;
  }
  // Children
  for (const child of node.childNodes) {
    const val = nodeToObj(child);
    if (val === undefined) continue;
    const key = child.nodeName === '#text' ? '#text' : child.nodeName;
    if (key in obj) {
      if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
      obj[key].push(val);
    } else {
      obj[key] = val;
    }
  }
  // Simplify: if only #text child, unwrap
  const keys = Object.keys(obj);
  if (keys.length === 1 && keys[0] === '#text') return obj['#text'];
  return keys.length ? obj : '';
}

// JS object → XML string
function objToXml(obj, tag = 'root', indent = '') {
  if (typeof obj === 'string' || typeof obj === 'number') return `${indent}<${tag}>${obj}</${tag}>`;
  if (Array.isArray(obj)) return obj.map(item => objToXml(item, tag, indent)).join('\n');
  const attrs = Object.entries(obj)
    .filter(([k]) => k.startsWith('@'))
    .map(([k, v]) => ` ${k.slice(1)}="${v}"`).join('');
  const children = Object.entries(obj)
    .filter(([k]) => !k.startsWith('@') && k !== '#text')
    .map(([k, v]) => objToXml(v, k, indent + '  ')).join('\n');
  const text = obj['#text'] ?? '';
  if (!children && !text) return `${indent}<${tag}${attrs}/>`;
  if (!children) return `${indent}<${tag}${attrs}>${text}</${tag}>`;
  return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`;
}

export default {
  tag: 'xml',
  instruction: `XML SKILL: Parse, format, or convert XML. Emit <xml>op:content</xml>.
Operations: parse (summarize), format (pretty-print), tojson (XML→JSON object), toxml (JSON→XML), strip (remove tags).

Examples:
- "Format this XML: <a><b>hi</b></a>" → <xml>format:<a><b>hi</b></a></xml>
- "Convert XML to JSON" → <xml>tojson:<person><name>Alice</name><age>30</age></person></xml>
- "Strip tags from HTML" → <xml>strip:<p>Hello <b>world</b></p></xml>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon < 0) return 'Format: op:content — ops: parse, format, tojson, toxml, strip';
    const op   = content.slice(0, colon).trim().toLowerCase();
    const body = content.slice(colon + 1).trim();

    if (op === 'toxml') {
      let obj;
      try { obj = JSON.parse(body); } catch { return 'toxml: expects valid JSON'; }
      return objToXml(obj);
    }

    // All other ops need a DOM parser (browser-only)
    if (typeof DOMParser === 'undefined') {
      // Node.js fallback for testing
      if (op === 'strip') return body.replace(/<[^>]+>/g, '');
      if (op === 'format') return indentXml(body);
      return '(DOMParser not available in this environment)';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return `XML parse error: ${err.textContent.split('\n')[0]}`;

    if (op === 'strip') {
      return doc.documentElement.textContent;
    }

    if (op === 'format') {
      const ser = new XMLSerializer();
      return indentXml(ser.serializeToString(doc));
    }

    if (op === 'parse') {
      const root = doc.documentElement;
      const countNodes = n => Array.from(n.childNodes).reduce((s, c) => s + (c.nodeType === 1 ? 1 + countNodes(c) : 0), 0);
      const count = countNodes(root);
      const attrs = root.attributes.length;
      return [
        `Root: <${root.tagName}>`,
        `Child elements: ${Array.from(root.childNodes).filter(n => n.nodeType === 1).length}`,
        `Total nodes: ${count}`,
        attrs ? `Root attributes: ${Array.from(root.attributes).map(a => `${a.name}="${a.value}"`).join(', ')}` : null,
      ].filter(Boolean).join('\n');
    }

    if (op === 'tojson') {
      const root = doc.documentElement;
      const obj = { [root.tagName]: nodeToObj(root) };
      return JSON.stringify(obj, null, 2);
    }

    return `Unknown op "${op}". Use: parse, format, tojson, toxml, strip`;
  },
  async handle() {},
};
