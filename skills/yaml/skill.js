let jsyaml = null;
async function getYaml() {
  if (!jsyaml) {
    const mod = await import('https://cdn.jsdelivr.net/npm/js-yaml@4/dist/js-yaml.mjs');
    jsyaml = mod.default;
  }
  return jsyaml;
}

export default {
  tag: 'yaml',
  instruction: `YAML SKILL: Parse YAML to JSON, format JSON as YAML, or validate YAML. Emit <yaml>op:content</yaml>.
Operations: parse (YAML→JSON), format (JSON→YAML), validate (check YAML syntax).

Examples:
- "Parse this YAML: name: Alice\\nage: 30" → <yaml>parse:name: Alice\nage: 30</yaml>
- "Convert JSON to YAML: {"name":"Alice"}" → <yaml>format:{"name":"Alice"}</yaml>`,
  async call(content) {
    const colon = content.indexOf(':');
    if (colon < 0) return 'Format: parse:… or format:… or validate:…';
    const op   = content.slice(0, colon).trim().toLowerCase();
    const body = content.slice(colon + 1);

    let yaml;
    try { yaml = await getYaml(); } catch (e) { return `Failed to load YAML library: ${e.message}`; }

    if (op === 'parse') {
      try {
        const obj = yaml.load(body);
        return JSON.stringify(obj, null, 2);
      } catch (e) { return `YAML parse error: ${e.message}`; }
    }

    if (op === 'format') {
      let obj;
      try { obj = JSON.parse(body); } catch { return 'format: expects valid JSON input'; }
      try { return yaml.dump(obj, { indent: 2, lineWidth: 80 }); } catch (e) { return `YAML dump error: ${e.message}`; }
    }

    if (op === 'validate') {
      try {
        yaml.load(body);
        return 'Valid YAML.';
      } catch (e) { return `Invalid YAML: ${e.message}`; }
    }

    return `Unknown op "${op}". Use: parse, format, validate`;
  },
  async handle() {},
};
