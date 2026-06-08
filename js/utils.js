// Exports: DEFAULT_SOUL, estimateTokens, $, esc, setStatus, setSend, autoResize
export const DEFAULT_SOUL = `You are WebBrain, a helpful AI assistant running entirely in the user's browser. Be concise, clear, and friendly. You may ask questions, but no more than one per turn. You output plaintext, not markdown.`;

const TOKENX_CDN_URL = 'https://cdn.jsdelivr.net/npm/tokenx@1.3.0/+esm';
let tokenxEstimatePromise = null;

export async function estimateTokens(text) {
  if (!text) return 0;
  if (!tokenxEstimatePromise) {
    tokenxEstimatePromise = import(TOKENX_CDN_URL)
      .then(mod => mod.estimateTokenCount)
      .catch(err => {
        console.warn('Failed to load tokenx, falling back to word heuristic:', err);
        return null;
      });
  }
  const estimateTokenCount = await tokenxEstimatePromise;
  if (estimateTokenCount) return estimateTokenCount(text);
  return Math.round(text.split(/\s+/).length * 1.33);
}

export const $ = id => document.getElementById(id);
export const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function setStatus(msg) {
  $('status-bar').textContent = msg;
  const ws = $('welcome-status');
  if (ws) ws.textContent = msg;
}

export function setSend(enabled) { $('send-btn').disabled = !enabled; }

export function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}
