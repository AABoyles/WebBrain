// ── Constants ─────────────────────────────────────────────────────────────────
const DB_NAME = 'webbrain';
const DB_VERSION = 1;
const DEFAULT_SOUL = `You are WebBrain, a helpful AI assistant running entirely in the user's browser. \
Be concise, clear, and friendly. When the user shares personal facts about themselves, note them. \
Stored memory is appended to this prompt automatically.`;
const DEFAULT_MODEL_URL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task';

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = ({ target: { result: d } }) => {
      if (!d.objectStoreNames.contains('facts')) d.createObjectStore('facts', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('chats')) d.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings');
    };
    req.onsuccess = ({ target: { result } }) => resolve(result);
    req.onerror = ({ target: { error } }) => reject(error);
  });
}

const db = await openDB();

function txGet(store, key) {
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readonly').objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function txPut(store, value, key) {
  return new Promise((resolve, reject) => {
    const os = db.transaction(store, 'readwrite').objectStore(store);
    const r = key !== undefined ? os.put(value, key) : os.put(value);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function txAdd(store, value) {
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readwrite').objectStore(store).add(value);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function txDelete(store, key) {
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
function txAll(store) {
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function txClear(store) {
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readwrite').objectStore(store).clear();
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

// ── Memory ────────────────────────────────────────────────────────────────────
const getFacts = () => txAll('facts');
const addFact = text => txAdd('facts', { text, created: Date.now() });
const deleteFact = id => txDelete('facts', id);
const clearFacts = () => txClear('facts');

async function buildSystemPrompt() {
  const soul = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
  const facts = await getFacts();
  if (!facts.length) return soul;
  return soul + '\n\n## What I know about you:\n' + facts.map(f => `- ${f.text}`).join('\n');
}

// ── Chat storage ──────────────────────────────────────────────────────────────
async function persistChat(id, messages, title) {
  if (id) {
    const existing = await txGet('chats', id);
    await txPut('chats', { ...existing, messages, title: title ?? existing.title, updated: Date.now() });
    return id;
  }
  return txAdd('chats', { messages, title: title ?? 'New Chat', created: Date.now(), updated: Date.now() });
}

// ── AI Backend ────────────────────────────────────────────────────────────────
let backend = 'none';
let session = null;
let llm = null;

async function initAI(preferredBackend) {
  session = null;
  llm = null;
  backend = 'none';

  if (!preferredBackend || preferredBackend === 'chrome') {
    if (await tryInitChrome()) return;
    if (preferredBackend === 'chrome') return;
  }
  if (preferredBackend === 'litert' || backend === 'none') {
    await tryInitLitert();
  }
}

// Returns the Chrome AI API object across all known property paths, or null.
function getChromeAIApi() {
  return window.ai?.languageModel  // current Prompt API
      ?? window.ai?.assistant      // older origin-trial name
      ?? window.LanguageModel      // standardized name (Chrome 136+)
      ?? null;
}

// Async check: actually calls capabilities() so we know the model is ready,
// not just that the JS object exists.
async function checkChromeAI() {
  try {
    const api = getChromeAIApi();
    if (!api) return false;
    if (typeof api.capabilities === 'function') {
      const caps = await api.capabilities();
      return caps.available !== 'no';
    }
    if (typeof api.availability === 'function') {
      const avail = await api.availability();
      return avail !== 'unavailable';
    }
    return true; // API exists but has no capability query — assume available
  } catch { return false; }
}

async function tryInitChrome() {
  try {
    const api = getChromeAIApi();
    if (!api) return false;
    if (typeof api.capabilities === 'function') {
      const caps = await api.capabilities();
      if (caps.available === 'no') return false;
      if (caps.available === 'after-download') setStatus('Chrome AI: downloading model…');
    }
    backend = 'chrome';
    setStatus('Chrome Built-in AI ready.');
    return true;
  } catch { return false; }
}

// ── OPFS model cache ──────────────────────────────────────────────────────────
// Streams the model file into the Origin Private File System so it survives
// page reloads without re-downloading. Falls back to an in-memory Blob URL
// when OPFS isn't available (e.g. non-secure context).
async function getModelBlobUrl(remoteUrl) {
  const filename = 'wb-' + remoteUrl.split('/').pop();

  if (navigator.storage?.getDirectory) {
    try {
      const root = await navigator.storage.getDirectory();
      // Cache hit: file exists and is non-empty
      try {
        const fh   = await root.getFileHandle(filename);
        const file = await fh.getFile();
        if (file.size > 1e6) {
          setStatus(`Model ready from cache (${(file.size / 1e9).toFixed(1)} GB).`);
          return URL.createObjectURL(file);
        }
      } catch { /* not cached yet */ }

      // Cache miss: stream download → OPFS
      setStatus('Downloading model (~2 GB)… 0%');
      const res = await fetch(remoteUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get('content-length') || 0);

      const fh       = await root.getFileHandle(filename, { create: true });
      const writable = await fh.createWritable();
      const reader   = res.body.getReader();
      let received   = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
        received += value.byteLength;
        const pct = total ? Math.round(received / total * 100) : '?';
        setStatus(`Downloading… ${pct}%  (${(received / 1e9).toFixed(2)} / ${(total / 1e9).toFixed(2)} GB)`);
      }
      await writable.close();

      const cached = await (await root.getFileHandle(filename)).getFile();
      setStatus(`Download complete — cached for next time (${(cached.size / 1e9).toFixed(1)} GB).`);
      return URL.createObjectURL(cached);

    } catch (e) {
      console.warn('OPFS cache error, falling back to in-memory blob:', e);
    }
  }

  // Fallback: buffer in memory (no persistent cache)
  setStatus('Downloading model (~2 GB) — no persistent cache in this context…');
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total   = Number(res.headers.get('content-length') || 0);
  const reader  = res.body.getReader();
  const chunks  = [];
  let received  = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    const pct = total ? Math.round(received / total * 100) : '?';
    setStatus(`Downloading… ${pct}%`);
  }
  return URL.createObjectURL(new Blob(chunks));
}

async function tryInitLitert() {
  const remoteUrl = (await txGet('settings', 'modelUrl')) ?? DEFAULT_MODEL_URL;
  try {
    const modelUrl = await getModelBlobUrl(remoteUrl);
    setStatus('Initializing Litert-LM…');
    const { FilesetResolver, LlmInference } = await import(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/genai_bundle.mjs'
    );
    const genai = await FilesetResolver.forGenAiTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm'
    );
    llm = await LlmInference.createFromOptions(genai, {
      baseOptions: { modelAssetPath: modelUrl },
      maxTokens: 1000,
      topK: 40,
      temperature: 0.8,
    });
    backend = 'litert';
    setStatus('Litert-LM ready.');
  } catch (e) {
    console.error('Litert-LM init failed:', e);
    setStatus(`Litert-LM failed: ${e.message}`);
  }
}

async function getOrCreateSession(systemPrompt, history) {
  if (backend !== 'chrome') return null;
  if (session) return session;
  const api = getChromeAIApi();
  const opts = { systemPrompt };
  // Only include initialPrompts when there is actual prior history to replay;
  // passing an empty array causes some Chrome builds to reject the create() call.
  const prior = history.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  if (prior.length) opts.initialPrompts = prior;
  try {
    session = await api.create(opts);
  } catch (e) {
    session = null;
    throw e;
  }
  return session;
}

async function* streamAI(messages, systemPrompt) {
  if (backend === 'chrome') {
    const sess    = await getOrCreateSession(systemPrompt, messages);
    const lastMsg = messages.at(-1).content;

    if (typeof sess.promptStreaming === 'function') {
      // Each chunk is an incremental delta — yield directly.
      // (Older Chrome builds returned cumulative text, but current builds return deltas.)
      const stream = sess.promptStreaming(lastMsg);
      for await (const chunk of stream) {
        if (chunk) yield chunk;
      }
    } else {
      // Older builds only expose prompt() (non-streaming)
      yield await sess.prompt(lastMsg);
    }

  } else if (backend === 'litert') {
    const lastMsg = messages.at(-1).content;
    const full    = `${systemPrompt}\n\nUser: ${lastMsg}\nAssistant:`;
    // generateResponse() returns Promise<string> directly; avoid wrapping it
    // in a second Promise because the inner callback may never fire.
    const response = await llm.generateResponse(full);
    yield response ?? '';

  } else {
    yield 'No AI backend is configured. Open Settings → Model to set one up.';
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setStatus(msg) {
  $('status-bar').textContent = msg;
  const ws = $('welcome-status');
  if (ws) ws.textContent = msg;
}

function setSend(enabled) { $('send-btn').disabled = !enabled; }

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

// ── Messages ──────────────────────────────────────────────────────────────────
let messages = [];
let chatId = null;
let generating = false;

function clearWelcome() { const w = $('welcome'); if (w) w.remove(); }

function appendBubble(role, text) {
  clearWelcome();
  const wrap = document.createElement('div');
  wrap.className = `bubble-wrap ${role}`;
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  wrap.appendChild(bubble);
  $('chat-messages').appendChild(wrap);
  $('chat-messages').scrollTop = $('chat-messages').scrollHeight;
  return bubble;
}

async function send() {
  const input = $('user-input');
  const text = input.value.trim();
  if (!text || generating) return;

  input.value = '';
  autoResize(input);
  generating = true;
  setSend(false);
  document.body.classList.add('thinking');

  messages.push({ role: 'user', content: text });
  appendBubble('user', text);

  const bubble = appendBubble('assistant', '');
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  bubble.appendChild(cursor);

  let fullText = '';
  try {
    const sysPrompt = await buildSystemPrompt();
    for await (const chunk of streamAI(messages, sysPrompt)) {
      fullText += chunk;
      bubble.textContent = fullText;
      bubble.appendChild(cursor);
      $('chat-messages').scrollTop = $('chat-messages').scrollHeight;
    }
    bubble.textContent = fullText;
    messages.push({ role: 'assistant', content: fullText });

    const title = messages[0].content.slice(0, 48);
    chatId = await persistChat(chatId, messages, title);
    await renderHistory();
    await maybeExtractFacts(text, fullText);
  } catch (e) {
    bubble.textContent = `[Error: ${e.message}]`;
    console.error(e);
  }

  generating = false;
  setSend(true);
  document.body.classList.remove('thinking');
  setStatus(backend === 'none' ? 'No AI backend.' : `Ready · ${backend}`);
}

async function maybeExtractFacts(userMsg, _aiMsg) {
  const m = userMsg.match(/\bmy name is\s+(\w[\w '-]*)/i)
    ?? userMsg.match(/^i'?m\s+(\w[\w '-]*)/i);
  if (m) await addFact(`User's name is ${m[1]}`);
}

// ── Chat history UI ───────────────────────────────────────────────────────────
async function renderHistory() {
  const all = await txAll('chats');
  const el = $('chat-history');
  el.innerHTML = '';
  all.sort((a, b) => b.updated - a.updated).forEach(chat => {
    const item = document.createElement('div');
    item.className = 'history-item' + (chat.id === chatId ? ' active' : '');
    item.innerHTML = `
      <span class="title">${esc(chat.title)}</span>
      <button class="del" title="Delete chat" data-id="${chat.id}">
        <i class="bi bi-x"></i>
      </button>`;
    item.querySelector('.del').addEventListener('click', async e => {
      e.stopPropagation();
      await txDelete('chats', chat.id);
      if (chatId === chat.id) newChat();
      else await renderHistory();
    });
    item.addEventListener('click', () => loadChat(chat));
    el.appendChild(item);
  });
}

async function loadChat(chat) {
  chatId = chat.id;
  messages = chat.messages ?? [];
  session = null;
  $('chat-title').textContent = chat.title;
  $('chat-messages').innerHTML = '';
  messages.forEach(m => appendBubble(m.role, m.content));
  await renderHistory();
}

function newChat() {
  chatId = null;
  messages = [];
  session = null;
  $('chat-title').textContent = 'New Chat';
  $('chat-messages').innerHTML = `
    <div id="welcome">
      <div class="welcome-rings">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="core"><i class="bi bi-cpu"></i></div>
      </div>
      <h1 class="welcome-title">Web<em>Brain</em></h1>
      <p id="welcome-status">${esc($('status-bar').textContent)}</p>
    </div>`;
  renderHistory();
}

// ── Memory UI ─────────────────────────────────────────────────────────────────
async function renderMemory() {
  const facts = await getFacts();
  const el = $('memory-list');
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
      session = null;
      await renderMemory();
    });
    el.appendChild(row);
  });
}

// ── Event listeners ───────────────────────────────────────────────────────────
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
  session = null;
  await renderMemory();
});

$('add-fact-btn').addEventListener('click', async () => {
  const input = $('new-fact');
  const text = input.value.trim();
  if (!text) return;
  await addFact(text);
  input.value = '';
  session = null;
  await renderMemory();
});
$('new-fact').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('add-fact-btn').click();
});

$('save-soul-btn').addEventListener('click', async () => {
  await txPut('settings', $('soul-editor').value, 'soul');
  session = null;
  bootstrap.Modal.getInstance($('settingsModal')).hide();
});
$('reset-soul-btn').addEventListener('click', async () => {
  await txPut('settings', DEFAULT_SOUL, 'soul');
  $('soul-editor').value = DEFAULT_SOUL;
  session = null;
});

$('apply-model-btn').addEventListener('click', async () => {
  const sel = $('model-select').value;
  const url = $('model-url').value.trim();
  if (url) await txPut('settings', url, 'modelUrl');
  await txPut('settings', sel, 'backend');
  session = null; llm = null;
  $('model-apply-msg').textContent = 'Reinitializing…';
  await initAI(sel);
  $('model-apply-msg').textContent = `Status: ${$('status-bar').textContent}`;
});

$('model-select').addEventListener('change', e => {
  $('litert-options').style.display = e.target.value === 'litert' ? '' : 'none';
});

$('settingsModal').addEventListener('show.bs.modal', async () => {
  const chromeOk = await checkChromeAI();
  const gpuOk = 'gpu' in navigator;
  $('backend-badges').innerHTML = `
    <span class="badge-pill ${chromeOk ? 'badge-ok' : 'badge-off'}">
      <span class="dot"></span>Chrome AI: ${chromeOk ? 'available' : 'not detected'}
    </span>
    <span class="badge-pill ${gpuOk ? 'badge-ok' : 'badge-off'}">
      <span class="dot"></span>WebGPU: ${gpuOk ? 'available' : 'not available'}
    </span>`;

  const savedBackend = await txGet('settings', 'backend');
  if (savedBackend) $('model-select').value = savedBackend;
  $('litert-options').style.display = $('model-select').value === 'litert' ? '' : 'none';
  const savedUrl = await txGet('settings', 'modelUrl');
  $('model-url').value = savedUrl ?? '';

  await renderMemory();
  $('soul-editor').value = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
});

// ── Boot ──────────────────────────────────────────────────────────────────────
const savedBackend = await txGet('settings', 'backend');
await initAI(savedBackend);
await renderHistory();
setSend(false);
$('user-input').dispatchEvent(new Event('input'));
