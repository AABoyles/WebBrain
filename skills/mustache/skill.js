// Minimal Mustache renderer: {{var}}, {{{unescaped}}}, {{#section}}, {{^inverted}}, {{.}} (current item)
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function resolve(ctx, key) {
  if (key === '.') return ctx[ctx.length - 1];
  const val = ctx.reduceRight((found, frame) => {
    if (found !== undefined) return found;
    return key.split('.').reduce((o, k) => (o != null ? o[k] : undefined), frame);
  }, undefined);
  return val;
}

function render(template, ctx) {
  // Process sections and inverted sections first (recursive)
  template = template.replace(/\{\{#(\w[\w.]*)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
    const val = resolve(ctx, key);
    if (!val) return '';
    if (Array.isArray(val)) return val.map(item => render(inner, [...ctx, item])).join('');
    if (typeof val === 'object') return render(inner, [...ctx, val]);
    return render(inner, ctx);
  });
  template = template.replace(/\{\{\^(\w[\w.]*)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
    const val = resolve(ctx, key);
    const empty = !val || (Array.isArray(val) && !val.length);
    return empty ? render(inner, ctx) : '';
  });
  // Unescaped triple braces
  template = template.replace(/\{\{\{([\w.]+)\}\}\}/g, (_, key) => {
    const v = resolve(ctx, key); return v == null ? '' : String(v);
  });
  // Escaped double braces
  template = template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const v = resolve(ctx, key); return v == null ? '' : escHtml(v);
  });
  return template;
}

export default {
  tag: 'mustache',
  instruction: `MUSTACHE TEMPLATE SKILL: Fill a Mustache template with JSON data. Emit <mustache>template|||jsonData</mustache> (three pipes as separator).
Supports: {{var}}, {{{unescaped}}}, {{#section}}…{{/section}}, {{^inverted}}…{{/inverted}}, {{.}} (loop item).

Examples:
- "Fill template" → <mustache>Hello, {{name}}!|||{"name":"World"}</mustache>
- "List template" → <mustache>{{#items}}- {{.}}\n{{/items}}|||{"items":["a","b","c"]}</mustache>`,
  call(content) {
    const sep = content.indexOf('|||');
    if (sep < 0) return 'Format: template|||{"key":"value"}';
    const template = content.slice(0, sep).replace(/\\n/g, '\n');
    const dataStr  = content.slice(sep + 3);
    let data;
    try { data = JSON.parse(dataStr); } catch { return 'Data must be valid JSON.'; }
    try { return render(template, [data]); } catch (e) { return `Template error: ${e.message}`; }
  },
  async handle() {},
};
