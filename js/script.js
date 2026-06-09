import { $, setSend, autoResize, DEFAULT_SOUL } from './utils.js';
import { initSkills, invalidateStaticSysPrompt } from './skills.js';
import { initAI, backend, resetSession, setThinkingMode } from './ai.js';
import {
  txGet, txPut,
  addFact, clearFacts,
  addTodo, clearDoneTodos,
} from '../skills/db.js';
import { send, generating, newChat, renderHistory, clearPerfHistory, resolveContextStrategy } from './chat.js';
import {
  renderMemory, renderSkills, renderTodos,
  renderBenchmarkTab, runBenchmark,
} from './settings-ui.js';

// ── Theme ─────────────────────────────────────────────────────────────────────
(function initTheme() {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch { /* storage blocked */ }
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  else saved = null;
  const isDark = saved === 'dark' ||
    (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const btn = $('theme-toggle');
  if (btn) btn.querySelector('i').className = isDark ? 'bi bi-sun' : 'bi bi-moon';
})();

// ── Event listeners ───────────────────────────────────────────────────────────
$('theme-toggle').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme;
  const isDark = cur === 'dark' ||
    (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* storage blocked */ }
  $('theme-toggle').querySelector('i').className = next === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
});

$('send-btn').addEventListener('click', send);

$('user-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});
$('user-input').addEventListener('input', e => {
  autoResize(e.target);
  setSend(e.target.value.trim().length > 0 && !generating && backend !== 'none');
});

$('toggle-sidebar').addEventListener('click', () =>
  $('sidebar').classList.toggle('collapsed')
);
$('new-chat-btn').addEventListener('click', newChat);

$('yeet-all-btn').addEventListener('click', async () => {
  if (!confirm('Delete all stored facts? This cannot be undone.')) return;
  await clearFacts();
  resetSession();
  await renderMemory();
});

$('add-fact-btn').addEventListener('click', async () => {
  const input = $('new-fact');
  const text  = input.value.trim();
  if (!text) return;
  await addFact(text);
  input.value = '';
  resetSession();
  await renderMemory();
});
$('new-fact').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('add-fact-btn').click();
});

$('clear-done-btn').addEventListener('click', async () => {
  await clearDoneTodos();
  await renderTodos();
});
$('add-todo-btn').addEventListener('click', async () => {
  const input = $('new-todo');
  const text  = input.value.trim();
  if (!text) return;
  await addTodo(text);
  input.value = '';
  await renderTodos();
});
$('new-todo').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('add-todo-btn').click();
});

$('clear-bench-btn').addEventListener('click', () => {
  clearPerfHistory();
  renderBenchmarkTab();
});

$('run-bench-btn').addEventListener('click', async () => {
  const n   = Math.max(1, Math.min(50, parseInt($('bench-count').value, 10) || 5));
  const btn = $('run-bench-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Running…';
  $('bench-run-status').textContent = '';
  $('bench-run-results').innerHTML = '';
  await runBenchmark(n);
  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-play-fill"></i> Run Benchmark';
});

['sliding', 'summarize', 'yolo'].forEach(strategy => {
  $(`ctx-btn-${strategy}`).addEventListener('click', () => {
    bootstrap.Modal.getInstance($('contextLimitModal'))?.hide();
    resolveContextStrategy(strategy);
  });
});

$('save-soul-btn').addEventListener('click', async () => {
  await txPut('settings', $('soul-editor').value, 'soul');
  invalidateStaticSysPrompt();
  resetSession();
  bootstrap.Modal.getInstance($('settingsModal')).hide();
});
$('reset-soul-btn').addEventListener('click', async () => {
  await txPut('settings', DEFAULT_SOUL, 'soul');
  $('soul-editor').value = DEFAULT_SOUL;
  invalidateStaticSysPrompt();
  resetSession();
});

$('apply-model-btn').addEventListener('click', async () => {
  const url = $('model-url').value.trim();
  if (url) await txPut('settings', url, 'modelUrl');
  $('model-apply-msg').textContent = 'Reinitializing…';
  await initAI();
  $('model-apply-msg').textContent = `Status: ${$('status-bar').textContent}`;
});

$('thinking-mode-toggle').addEventListener('change', async e => {
  await txPut('settings', e.target.checked, 'thinkingMode');
  setThinkingMode(e.target.checked);
  resetSession();
});

$('settingsModal').addEventListener('show.bs.modal', async () => {
  const gpuOk = 'gpu' in navigator;
  $('backend-badges').innerHTML = `
    <span class="badge-pill ${gpuOk ? 'badge-ok' : 'badge-off'}">
      <span class="dot"></span>WebGPU: ${gpuOk ? 'available' : 'not available'}
    </span>`;

  const savedUrl = await txGet('settings', 'modelUrl');
  $('model-url').value = savedUrl ?? '';
  $('thinking-mode-toggle').checked = !!(await txGet('settings', 'thinkingMode'));

  await renderMemory();
  await renderSkills();
  await renderTodos();
  renderBenchmarkTab();
  $('soul-editor').value = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
});

// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── Boot ──────────────────────────────────────────────────────────────────────
await Promise.all([initAI(), initSkills()]);
await renderHistory();
setSend(false);
$('user-input').dispatchEvent(new Event('input'));
