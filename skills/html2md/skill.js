// HTML → Markdown via recursive DOM walk (browser-only; Node.js fallback uses regex)
function walkNode(node, opts = {}) {
  if (node.nodeType === 3) return node.nodeValue; // text node
  if (node.nodeType !== 1) return '';
  const tag  = node.tagName.toLowerCase();
  const kids = () => Array.from(node.childNodes).map(n => walkNode(n, opts)).join('');

  switch (tag) {
    case 'h1': return `# ${kids()}\n\n`;
    case 'h2': return `## ${kids()}\n\n`;
    case 'h3': return `### ${kids()}\n\n`;
    case 'h4': return `#### ${kids()}\n\n`;
    case 'h5': return `##### ${kids()}\n\n`;
    case 'h6': return `###### ${kids()}\n\n`;
    case 'p':  return `${kids()}\n\n`;
    case 'br': return '\n';
    case 'strong': case 'b': return `**${kids()}**`;
    case 'em': case 'i':     return `_${kids()}_`;
    case 's':  case 'del':   return `~~${kids()}~~`;
    case 'code': return opts.inPre ? kids() : `\`${kids()}\``;
    case 'pre': {
      const lang = node.querySelector('code')?.className.replace('language-','') ?? '';
      return `\`\`\`${lang}\n${walkNode(node.firstChild ?? node, {...opts, inPre:true})}\n\`\`\`\n\n`;
    }
    case 'a': {
      const href = node.getAttribute('href') ?? '';
      return `[${kids()}](${href})`;
    }
    case 'img': {
      const alt = node.getAttribute('alt') ?? '';
      const src = node.getAttribute('src') ?? '';
      return `![${alt}](${src})`;
    }
    case 'ul': return Array.from(node.children).map(li => `- ${walkNode(li, opts).trim()}\n`).join('') + '\n';
    case 'ol': return Array.from(node.children).map((li, i) => `${i+1}. ${walkNode(li, opts).trim()}\n`).join('') + '\n';
    case 'li': return kids();
    case 'blockquote': return kids().split('\n').map(l => `> ${l}`).join('\n') + '\n\n';
    case 'hr': return '---\n\n';
    case 'table': {
      const rows = Array.from(node.querySelectorAll('tr'));
      if (!rows.length) return '';
      const cells = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => c.textContent.trim()));
      const header = `| ${cells[0].join(' | ')} |`;
      const sep    = `| ${cells[0].map(() => '---').join(' | ')} |`;
      const body   = cells.slice(1).map(r => `| ${r.join(' | ')} |`).join('\n');
      return [header, sep, body].join('\n') + '\n\n';
    }
    case 'script': case 'style': return '';
    default: return kids();
  }
}

// Simple regex-based fallback for Node.js / non-browser
function regexFallback(html) {
  return html
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, n, t) => '#'.repeat(+n) + ' ' + t.replace(/<[^>]+>/g,'') + '\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default {
  tag: 'html2md',
  instruction: `HTML TO MARKDOWN SKILL: Convert HTML to Markdown. call <|tool_call>call:html2md{input:<|"|>html content<|"|>}<tool_call|>.

Examples:
- "Convert <h1>Title</h1><p>Hello <b>world</b></p>" → <|tool_call>call:html2md{input:<|"|><h1>Title</h1><p>Hello <b>world</b></p><|"|>}<tool_call|>`,
  call(content) {
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(content, 'text/html');
      const md  = walkNode(doc.body).replace(/\n{3,}/g, '\n\n').trim();
      return md || '(empty)';
    }
    return regexFallback(content);
  },
  async handle() {},
};
