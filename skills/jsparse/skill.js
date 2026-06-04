let acornLib = null;
async function getAcorn() {
  if (!acornLib) {
    const mod = await import('https://cdn.jsdelivr.net/npm/acorn@8/dist/acorn.mjs');
    acornLib = mod;
  }
  return acornLib;
}

function summarizeAst(node, depth = 0) {
  if (!node || typeof node !== 'object') return [];
  const indent = '  '.repeat(depth);
  const lines = [];
  const type = node.type ?? '';
  if (!type) return lines;

  let label = type;
  if (type === 'Identifier')         label += ` "${node.name}"`;
  else if (type === 'Literal')       label += ` ${JSON.stringify(node.value)}`;
  else if (type === 'FunctionDeclaration' || type === 'FunctionExpression')
    label += node.id ? ` ${node.id.name}()` : '(anonymous)';
  else if (type === 'ClassDeclaration') label += ` ${node.id?.name ?? ''}`;
  else if (type === 'VariableDeclaration') label += ` (${node.kind})`;
  else if (type === 'MemberExpression')
    label += ` .${node.property?.name ?? ''}`;

  lines.push(`${indent}${label}`);

  // Recurse into meaningful children only (skip loc, raw, etc.)
  const SKIP = new Set(['type','start','end','loc','range','raw','regex','bigint']);
  for (const [key, val] of Object.entries(node)) {
    if (SKIP.has(key)) continue;
    if (Array.isArray(val)) {
      for (const child of val) if (child?.type) lines.push(...summarizeAst(child, depth + 1));
    } else if (val?.type) {
      lines.push(...summarizeAst(val, depth + 1));
    }
  }
  return lines;
}

export default {
  tag: 'jsparse',
  instruction: `JAVASCRIPT PARSER SKILL: Parse JavaScript and show its AST structure, or count tokens/nodes. Emit <jsparse>op:code</jsparse>.
Operations: ast (show tree), count (node/token summary), validate (syntax check only).

Examples:
- "Show AST of function" → <jsparse>ast:function add(a,b){return a+b}</jsparse>
- "Validate syntax" → <jsparse>validate:const x = </jsparse>`,
  async call(content) {
    const colon = content.indexOf(':');
    if (colon < 0) return 'Format: op:code — ops: ast, count, validate';
    const op   = content.slice(0, colon).trim().toLowerCase();
    const code = content.slice(colon + 1);

    let acorn;
    try { acorn = await getAcorn(); } catch (e) { return `Failed to load parser: ${e.message}`; }

    let ast;
    try {
      ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
    } catch (e) {
      if (op === 'validate') return `Syntax error: ${e.message}`;
      return `Parse error: ${e.message}`;
    }

    if (op === 'validate') return '✓ Valid JavaScript syntax.';

    if (op === 'count') {
      const counts = {};
      function walk(n) {
        if (!n || typeof n !== 'object') return;
        if (n.type) counts[n.type] = (counts[n.type] ?? 0) + 1;
        for (const v of Object.values(n)) {
          if (Array.isArray(v)) v.forEach(walk);
          else if (v?.type) walk(v);
        }
      }
      walk(ast);
      const total = Object.values(counts).reduce((s, n) => s + n, 0);
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return [`Total AST nodes: ${total}`, ...sorted.map(([t, n]) => `  ${t}: ${n}`)].join('\n');
    }

    if (op === 'ast') {
      const lines = summarizeAst(ast);
      if (lines.length > 60) return lines.slice(0, 60).join('\n') + `\n… (${lines.length - 60} more lines)`;
      return lines.join('\n');
    }

    return `Unknown op "${op}". Use: ast, count, validate`;
  },
  async handle() {},
};
