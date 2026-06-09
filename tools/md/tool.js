let markedLib = null;
async function getMarked() {
  if (!markedLib) {
    const mod = await import('https://cdn.jsdelivr.net/npm/marked@14/src/marked.esm.js');
    markedLib = mod.marked;
  }
  return markedLib;
}

export default {
  tag: 'md',
  instruction: `MARKDOWN RENDER SKILL: To render Markdown as formatted HTML in the chat, call <|tool_call>call:md{input:<|"|>markdown text<|"|>}<tool_call|>.
The rendered HTML is injected directly into the response area.

Examples:
- "Render this markdown: # Hello\\n**bold** text" → <|tool_call>call:md{input:<|"|># Hello\n**bold** text<|"|>}<tool_call|>`,
  async call(content) {
    try {
      const marked = await getMarked();
      const html = marked.parse(content.replace(/\\n/g, '\n'));
      return `[Rendered ${content.split('\n').length} line(s) of Markdown as HTML]`;
    } catch (e) {
      return `Markdown error: ${e.message}`;
    }
  },
  async handle(content) {
    if (typeof document === 'undefined') return;
    let marked;
    try { marked = await getMarked(); } catch { return; }
    const html = marked.parse(content.replace(/\\n/g, '\n'));
    // Inject a rendered block after the response
    const div = document.createElement('div');
    div.className = 'md-render';
    div.innerHTML = html;
    div.style.cssText = 'padding:8px 12px;margin:4px 0;border-left:3px solid #888;border-radius:4px;';
    // Append to the last assistant message
    const messages = document.querySelectorAll('.message.assistant');
    const last = messages[messages.length - 1];
    if (last) last.appendChild(div);
  },
};
