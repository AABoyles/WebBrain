// RFC 4180-compliant CSV parser
function parseCsv(text, sep = ',') {
  const rows = [];
  let row = [], field = '', inQuote = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; }
      else if (ch === '"') { inQuote = false; i++; }
      else { field += ch; i++; }
    } else {
      if (ch === '"') { inQuote = true; i++; }
      else if (ch === sep) { row.push(field); field = ''; i++; }
      else if (ch === '\r' && text[i + 1] === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 2; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; }
      else { field += ch; i++; }
    }
  }
  row.push(field);
  if (row.some(f => f !== '')) rows.push(row);
  return rows;
}

function toCsv(rows, sep = ',') {
  return rows.map(row =>
    row.map(f => {
      const s = String(f);
      return s.includes(sep) || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(sep)
  ).join('\n');
}

export default {
  tag: 'csv',
  instruction: `CSV SKILL: Parse or analyze CSV/TSV data. Emit <csv>op:data</csv>.
Operations: parse (summary + first few rows), tojson (CSV→JSON array), tocsv (JSON array→CSV), tsv (TSV input — like parse but tab-delimited).

Examples:
- "Parse this CSV: name,age\\nAlice,30\\nBob,25" → <csv>parse:name,age\nAlice,30\nBob,25</csv>
- "CSV to JSON" → <csv>tojson:name,age\nAlice,30</csv>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon < 0) return 'Format: op:data — ops: parse, tojson, tocsv, tsv';
    const op   = content.slice(0, colon).trim().toLowerCase();
    const body = content.slice(colon + 1);

    if (op === 'tocsv') {
      let arr;
      try { arr = JSON.parse(body); } catch { return 'tocsv: expects JSON array of arrays or objects'; }
      if (!Array.isArray(arr) || !arr.length) return 'tocsv: expects non-empty JSON array';
      if (typeof arr[0] === 'object' && !Array.isArray(arr[0])) {
        const keys = Object.keys(arr[0]);
        const rows = [keys, ...arr.map(o => keys.map(k => o[k] ?? ''))];
        return toCsv(rows);
      }
      return toCsv(arr);
    }

    const sep  = op === 'tsv' ? '\t' : ',';
    const rows = parseCsv(body.replace(/\\n/g, '\n').replace(/\\t/g, '\t'), sep);
    if (!rows.length) return 'No data found.';

    if (op === 'tojson') {
      const [headers, ...data] = rows;
      const objs = data.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
      return JSON.stringify(objs, null, 2);
    }

    // parse / tsv — summary
    const [headers, ...data] = rows;
    const preview = data.slice(0, 3).map((r, i) =>
      `  Row ${i + 2}: ${headers.map((h, j) => `${h}=${r[j] ?? ''}`).join(', ')}`
    );
    return [
      `Columns (${headers.length}): ${headers.join(', ')}`,
      `Rows: ${data.length} (+ 1 header)`,
      '',
      'Preview:',
      ...preview,
      data.length > 3 ? `  … and ${data.length - 3} more row(s)` : '',
    ].filter(l => l !== undefined).join('\n');
  },
  async handle() {},
};
