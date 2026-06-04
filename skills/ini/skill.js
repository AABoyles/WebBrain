function parseIni(text) {
  const result = { _global: {} };
  let section = '_global';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1).trim();
      if (!result[section]) result[section] = {};
      continue;
    }
    const eq = line.indexOf('=');
    const colon = line.indexOf(':');
    const sep = eq >= 0 && (colon < 0 || eq < colon) ? eq : colon;
    if (sep < 0) continue;
    const key = line.slice(0, sep).trim();
    let val = line.slice(sep + 1).trim();
    // Strip inline comments
    val = val.replace(/\s+(;|#).*$/, '');
    // Unquote
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    result[section][key] = val;
  }
  return result;
}

function formatIni(obj) {
  const lines = [];
  const { _global = {}, ...sections } = obj;
  for (const [k, v] of Object.entries(_global)) lines.push(`${k} = ${v}`);
  if (lines.length && Object.keys(sections).length) lines.push('');
  for (const [sec, vals] of Object.entries(sections)) {
    lines.push(`[${sec}]`);
    for (const [k, v] of Object.entries(vals)) lines.push(`${k} = ${v}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

function summarize(parsed) {
  const { _global, ...sections } = parsed;
  const lines = [];
  const gKeys = Object.keys(_global);
  if (gKeys.length) lines.push(`Global: ${gKeys.length} key(s) — ${gKeys.join(', ')}`);
  for (const [sec, vals] of Object.entries(sections)) {
    const keys = Object.keys(vals);
    lines.push(`[${sec}]: ${keys.length} key(s) — ${keys.join(', ')}`);
  }
  return lines.join('\n');
}

export default {
  tag: 'ini',
  instruction: `INI CONFIG SKILL: To parse an INI string emit <ini>parse:content</ini>. To convert JSON to INI emit <ini>format:{"section":{"key":"val"}}</ini>.

Examples:
- "Parse this INI: [db]\\nhost=localhost" → <ini>parse:[db]\nhost=localhost</ini>
- "Format as INI: {"server":{"port":"8080"}}" → <ini>format:{"server":{"port":"8080"}}</ini>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon < 0) return 'Format: parse:… or format:…';
    const op   = content.slice(0, colon).trim().toLowerCase();
    const body = content.slice(colon + 1);

    if (op === 'parse') {
      const parsed = parseIni(body);
      const { _global, ...sections } = parsed;
      const summary = summarize(parsed);
      const secCount = Object.keys(sections).length;
      const gCount   = Object.keys(_global).length;
      return `Parsed INI: ${gCount} global key(s), ${secCount} section(s)\n${summary}`;
    }

    if (op === 'format') {
      let obj;
      try { obj = JSON.parse(body); } catch { return 'format: expects valid JSON object'; }
      return formatIni(obj);
    }

    return `Unknown op "${op}". Use parse: or format:`;
  },
  async handle() {},
};
