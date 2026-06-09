// Exports: renderMemory, renderTools, renderTodos, renderBenchmarkTab, runBenchmark
import { $, esc, estimateTokens, DEFAULT_SOUL } from './utils.js';
import { SKILLS, manifest } from './tools.js';
import { backend, computeMaxTokens, destroySession, streamAI, resetSession } from './ai.js';
import { perfHistory } from './chat.js';
import {
  getFacts, deleteFact,
  getTodos, setTodoDone, deleteTodo,
} from '../tools/db.js';

// ── Memory UI ─────────────────────────────────────────────────────────────────
export async function renderMemory() {
  const facts = await getFacts();
  const el    = $('memory-list');
  if (!facts.length) {
    el.innerHTML = '<p class="empty-state">No facts stored yet. WebBrain picks these up from conversation.</p>';
    return;
  }
  el.innerHTML = '';
  facts.forEach(f => {
    const row = document.createElement('div');
    row.className = 'fact-row';
    row.innerHTML = `
      <span class="fact-text">${esc(f.text)}</span>
      <button class="del" title="Delete" data-id="${f.id}"><i class="bi bi-trash"></i></button>`;
    row.querySelector('.del').addEventListener('click', async () => {
      await deleteFact(f.id);
      resetSession();
      await renderMemory();
    });
    el.appendChild(row);
  });
}

// ── Tools UI ─────────────────────────────────────────────────────────────────
const SKILL_CATEGORY_ORDER = [
  'Core',
  'Productivity',
  'Text, Data & Encoding',
  'Developer & Identifier Tools',
  'Math & Number Theory',
  'Music & Audio',
  'World & Science',
  'Language & Writing',
  'Fun & Culture'
];

function slugifyCategory(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function renderTools(openCategoryId = null) {
  const el = $('tools-accordion');
  el.innerHTML = '';

  const loadedTags = new Set(SKILLS.map(s => s.tag));

  const discovered = [...new Set(manifest.map(entry => entry.category).filter(Boolean))];
  const categoryOrder = [
    ...SKILL_CATEGORY_ORDER.filter(c => discovered.includes(c)),
    ...discovered.filter(c => !SKILL_CATEGORY_ORDER.includes(c)).sort((a, b) => a.localeCompare(b)),
  ];
  const grouped = new Map(categoryOrder.map(label => [label, []]));
  for (const entry of manifest) {
    const category = entry.category || 'General Utilities';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(entry);
  }

  const validOpenCategoryId = openCategoryId && categoryOrder.some(
    c => slugifyCategory(c) === openCategoryId
  ) ? openCategoryId : null;
  let firstCategory = true;

  for (const category of categoryOrder) {
    const entries = grouped.get(category);
    if (!entries?.length) continue;

    const catId  = slugifyCategory(category);
    const isOpen = validOpenCategoryId ? catId === validOpenCategoryId : firstCategory;
    const loadedCount = entries.filter(e => loadedTags.has(e.tag)).length;

    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `
      <h2 class="accordion-header" id="tools-heading-${catId}">
        <button class="accordion-button ${isOpen ? '' : 'collapsed'}" type="button"
                data-bs-toggle="collapse" data-bs-target="#tools-collapse-${catId}"
                aria-expanded="${isOpen ? 'true' : 'false'}" aria-controls="tools-collapse-${catId}">
          <span class="tools-cat-title">${esc(category)}</span>
          <span class="tools-cat-meta">${loadedCount ? loadedCount + ' loaded' : entries.length + ' available'}</span>
        </button>
      </h2>
      <div id="tools-collapse-${catId}" class="accordion-collapse collapse ${isOpen ? 'show' : ''}"
           aria-labelledby="tools-heading-${catId}" data-bs-parent="#tools-accordion">
        <div class="accordion-body"><div class="tools-category-list"></div></div>
      </div>`;

    const list = item.querySelector('.tools-category-list');
    for (const entry of entries) {
      const isLoaded = loadedTags.has(entry.tag);
      const loaded   = SKILLS.find(s => s.tag === entry.tag);
      const approxTokens = loaded?.instruction ? await estimateTokens(loaded.instruction) : 0;

      const row = document.createElement('div');
      row.className = 'tool-row';
      row.innerHTML = `
        <div class="tool-info">
          <span class="tool-name">${esc(entry.label)}</span>
          ${isLoaded ? `<small class="tool-tokens">${entry.default ? 'always-on' : 'loaded'}${approxTokens ? ' · ~' + approxTokens.toLocaleString() + ' tok' : ''}</small>` : ''}
          <span class="tool-desc">${esc(entry.description)}</span>
        </div>`;
      list.appendChild(row);
    }

    el.appendChild(item);
    firstCategory = false;
  }

  const maxTok = await computeMaxTokens();
  const src    = navigator.gpu ? 'estimated from WebGPU VRAM' : 'WebGPU unavailable — using minimum fallback';
  $('context-window-note').textContent =
    `Context window on this device: ~${maxTok.toLocaleString()} tokens (${src}). Tools load on demand when invoked.`;
}

// ── Todos UI ──────────────────────────────────────────────────────────────────
export async function renderTodos() {
  const todos = await getTodos();
  const el    = $('todo-list');
  if (!el) return;
  if (!todos.length) {
    el.innerHTML = '<p class="empty-state">No tasks yet. Ask WebBrain to add some, or use the form below.</p>';
    return;
  }
  el.innerHTML = '';
  todos.sort((a, b) => a.created - b.created).forEach(t => {
    const row = document.createElement('div');
    row.className = 'fact-row' + (t.done ? ' todo-done' : '');
    row.innerHTML = `
      <label class="todo-label">
        <input type="checkbox" class="todo-check" data-id="${t.id}"${t.done ? ' checked' : ''}>
        <span class="fact-text">${esc(t.text)}</span>
      </label>
      <button class="del" title="Delete" data-id="${t.id}"><i class="bi bi-trash"></i></button>`;
    row.querySelector('.todo-check').addEventListener('change', async e => {
      await setTodoDone(t.id, e.target.checked);
      await renderTodos();
    });
    row.querySelector('.del').addEventListener('click', async () => {
      await deleteTodo(t.id);
      await renderTodos();
    });
    el.appendChild(row);
  });
}

// ── Benchmark UI ─────────────────────────────────────────────────────────────
function fmtMs(ms) {
  if (ms === null || ms === undefined) return '—';
  return ms < 1000 ? Math.round(ms) + 'ms' : (ms / 1000).toFixed(2) + 's';
}

export function renderBenchmarkTab() {
  const summaryEl = $('bench-summary');
  const tbodyEl   = $('bench-tbody');
  if (!summaryEl || !tbodyEl) return;

  if (!perfHistory.length) {
    summaryEl.innerHTML = '<p class="empty-state" style="grid-column:1/-1">No exchanges recorded yet — have a conversation to see metrics here.</p>';
    tbodyEl.innerHTML = '';
    return;
  }

  const totalExchanges = perfHistory.length;
  const totalTokIn  = perfHistory.reduce((s, r) => s + r.tokensInSystem + r.tokensInTools + r.tokensInUser, 0);
  const totalTokOut = perfHistory.reduce((s, r) => s + r.tokensOutUser + r.tokensOutToolCalls, 0);
  const validTTFT   = perfHistory.filter(r => r.ttft !== null).map(r => r.ttft);
  const avgTTFT     = validTTFT.length ? validTTFT.reduce((a, b) => a + b) / validTTFT.length : null;
  const totalGenMs  = perfHistory.reduce((s, r) => s + r.genMs, 0);
  const avgTPS      = totalGenMs > 0 && totalTokOut > 0 ? (totalTokOut / (totalGenMs / 1000)).toFixed(1) : '—';
  const avgTPOT     = totalTokOut > 0 ? Math.round(totalGenMs / totalTokOut) : null;
  const validITL    = perfHistory.filter(r => r.itl !== null).map(r => r.itl);
  const avgITL      = validITL.length ? validITL.reduce((a, b) => a + b) / validITL.length : null;

  summaryEl.innerHTML = `
    <div class="bench-stat"><span class="bench-stat-value">${totalExchanges}</span><span class="bench-stat-label">Exchanges</span></div>
    <div class="bench-stat"><span class="bench-stat-value">${totalTokIn.toLocaleString()}</span><span class="bench-stat-label">Total Tok In</span></div>
    <div class="bench-stat"><span class="bench-stat-value">${totalTokOut.toLocaleString()}</span><span class="bench-stat-label">Total Tok Out</span></div>
    <div class="bench-stat"><span class="bench-stat-value">${fmtMs(avgTTFT)}</span><span class="bench-stat-label">Avg TTFT</span></div>
    <div class="bench-stat"><span class="bench-stat-value">${avgTPS}</span><span class="bench-stat-label">Avg TPS</span></div>
    <div class="bench-stat"><span class="bench-stat-value">${avgTPOT !== null ? avgTPOT + 'ms' : '—'}</span><span class="bench-stat-label">Avg TPOT</span></div>
    ${avgITL !== null ? `<div class="bench-stat"><span class="bench-stat-value">${Math.round(avgITL)}ms</span><span class="bench-stat-label">Avg ITL</span></div>` : ''}
  `;

  tbodyEl.innerHTML = '';
  [...perfHistory].reverse().forEach((r, ri) => {
    const idx    = perfHistory.length - ri;
    const tokIn  = r.tokensInSystem + r.tokensInTools + r.tokensInUser;
    const tokOut = r.tokensOutUser + r.tokensOutToolCalls;
    const tps    = r.genMs > 0 && tokOut > 0 ? (tokOut / (r.genMs / 1000)).toFixed(1) : '—';
    const tpot   = tokOut > 0 ? Math.round(r.genMs / tokOut) + 'ms' : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx}</td>
      <td>${esc(r.backend || '?')}</td>
      <td title="System: ${r.tokensInSystem} | Tools: ${r.tokensInTools} | User: ${r.tokensInUser}">
        ${tokIn}<span class="bench-tok-detail">${r.tokensInSystem}+${r.tokensInTools}+${r.tokensInUser}</span>
      </td>
      <td title="User output: ${r.tokensOutUser} | Tool calls: ${r.tokensOutToolCalls}">
        ${tokOut}<span class="bench-tok-detail">${r.tokensOutUser}+${r.tokensOutToolCalls}</span>
      </td>
      <td>${fmtMs(r.ttft)}</td>
      <td>${r.itl !== null ? Math.round(r.itl) + 'ms' : '—'}</td>
      <td>${tps}</td>
      <td>${tpot}</td>
      <td>${r.passes}</td>`;
    tbodyEl.appendChild(tr);
  });
}

function renderBenchmarkResults(results, container) {
  const valid = results.filter(r => !r.error);
  if (!valid.length) {
    container.innerHTML = '<p class="empty-state">All queries failed — check console for errors.</p>';
    return;
  }

  const ttfts = valid.map(r => r.ttft).filter(x => x !== null);
  const tpss  = valid.filter(r => r.tokens > 0 && r.genMs > 0).map(r => r.tokens / (r.genMs / 1000));
  const tpots = valid.filter(r => r.tokens > 0 && r.genMs > 0).map(r => r.genMs / r.tokens);

  function statRow(arr) {
    if (!arr.length) return { min: '—', avg: '—', p95: '—', max: '—' };
    const s   = [...arr].sort((a, b) => a - b);
    const avg = s.reduce((a, b) => a + b) / s.length;
    const p95 = s[Math.max(0, Math.ceil(s.length * 0.95) - 1)];
    return { min: s[0].toFixed(1), avg: avg.toFixed(1), p95: p95.toFixed(1), max: s[s.length - 1].toFixed(1) };
  }

  const ttftStats = statRow(ttfts);
  const tpsStats  = statRow(tpss);
  const tpotStats = statRow(tpots);

  container.innerHTML = `
    <table class="bench-table" style="margin-bottom:0.75rem;">
      <thead>
        <tr><th>Metric</th><th>Min</th><th>Avg</th><th>p95</th><th>Max</th></tr>
      </thead>
      <tbody>
        <tr><td>TTFT (ms)</td><td>${ttftStats.min}</td><td>${ttftStats.avg}</td><td>${ttftStats.p95}</td><td>${ttftStats.max}</td></tr>
        <tr><td>TPS (tok/s)</td><td>${tpsStats.min}</td><td>${tpsStats.avg}</td><td>${tpsStats.p95}</td><td>${tpsStats.max}</td></tr>
        <tr><td>TPOT (ms/tok)</td><td>${tpotStats.min}</td><td>${tpotStats.avg}</td><td>${tpotStats.p95}</td><td>${tpotStats.max}</td></tr>
      </tbody>
    </table>
    <details>
      <summary class="f-hint" style="cursor:pointer;user-select:none;">Per-query details (${results.length} quer${results.length === 1 ? 'y' : 'ies'})</summary>
      <table class="bench-table" style="margin-top:0.5rem;">
        <thead><tr><th>#</th><th>Prompt</th><th>Tokens</th><th>TTFT</th><th>TPS</th><th>Status</th></tr></thead>
        <tbody>
          ${results.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td title="${esc(r.prompt)}">${esc(r.prompt.length > 32 ? r.prompt.slice(0, 32) + '…' : r.prompt)}</td>
              ${r.error
                ? `<td></td><td></td><td></td><td style="color:var(--danger)">${esc(r.error)}</td>`
                : `<td>${r.tokens}</td>
                   <td>${fmtMs(r.ttft)}</td>
                   <td>${r.tokens > 0 && r.genMs > 0 ? (r.tokens / (r.genMs / 1000)).toFixed(1) : '—'}</td>
                   <td style="color:var(--success)">OK</td>`
              }
            </tr>`).join('')}
        </tbody>
      </table>
    </details>
  `;
}

const BENCH_PROMPTS = [
  'What is 7 times 8?',
  'Name a primary color.',
  'What is 2 + 2?',
  'Say "hello" in Spanish.',
  'Name a planet in our solar system.',
  'What day comes after Tuesday?',
  'Name a fruit.',
  'What is the boiling point of water in Celsius?',
  'Name an ocean.',
  'What is the square root of 16?',
];

export async function runBenchmark(n) {
  if (backend === 'none') {
    $('bench-run-status').textContent = 'No AI backend configured — open the Model tab to set one up.';
    return;
  }
  const statusEl  = $('bench-run-status');
  const resultsEl = $('bench-run-results');
  resultsEl.innerHTML = '';

  const results = [];
  for (let i = 0; i < n; i++) {
    statusEl.textContent = `Running query ${i + 1} / ${n}…`;
    const prompt = BENCH_PROMPTS[i % BENCH_PROMPTS.length];
    const msgs   = [{ role: 'user', content: prompt }];
    const rec    = { prompt, ttft: null, genMs: 0, tokens: 0, error: null };
    try {
      destroySession();
      const t0 = performance.now();
      let text = '';
      let firstChunk = true;
      for await (const chunk of streamAI(msgs, DEFAULT_SOUL)) {
        if (firstChunk && chunk) { rec.ttft = performance.now() - t0; firstChunk = false; }
        text += chunk;
      }
      rec.genMs  = performance.now() - t0;
      rec.tokens = await estimateTokens(text);
    } catch (e) {
      rec.error = e.message;
    }
    results.push(rec);
  }

  destroySession();
  statusEl.textContent = `Done — ${n} quer${n === 1 ? 'y' : 'ies'} completed.`;
  renderBenchmarkResults(results, resultsEl);
}
