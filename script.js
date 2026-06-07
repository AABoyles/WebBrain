import {
  txGet, txPut, txAdd, txDelete, txAll,
  getFacts, addFact, deleteFact, clearFacts,
  getTodos, addTodo, setTodoDone, deleteTodo, clearDoneTodos,
} from './skills/db.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_SOUL = `You are WebBrain, a helpful AI assistant running entirely in the user's browser. Be concise, clear, and friendly. You may ask questions, but no more than one per turn. You output plaintext, not markdown.`;
const DEFAULT_MODEL_URL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task';

// ── Skills registry ───────────────────────────────────────────────────────────
// Populated on boot from manifest + dynamic imports. Only loaded (enabled) skills live here.
let SKILLS   = [];
let manifest = [];

async function getEnabledSkills() {
  const raw = await txGet('settings', 'enabledSkills');
  if (raw !== undefined) return new Set(JSON.parse(raw));
  // First run: seed from manifest defaults
  const defaults = new Set(manifest.filter(e => e.default).map(e => e.tag));
  await setEnabledSkills(defaults);
  return defaults;
}

async function setEnabledSkills(set) {
  await txPut('settings', JSON.stringify([...set]), 'enabledSkills');
}

async function loadSkill(tag) {
  if (SKILLS.some(s => s.tag === tag)) return;
  invalidateStaticSysPrompt();
  try {
    const { default: skill } = await import(`./skills/${tag}/skill.js`);
    SKILLS.push(skill);
  } catch (e) {
    console.error(`Failed to load skill "${tag}":`, e);
  }
}

function unloadSkill(tag) {
  SKILLS = SKILLS.filter(s => s.tag !== tag);
  invalidateStaticSysPrompt();
}

async function initSkills() {
  manifest = await fetch('./skills/manifest.json').then(r => r.json());
  const enabled = await getEnabledSkills();
  await Promise.all([...enabled].map(loadSkill));
}

// ── System prompt ─────────────────────────────────────────────────────────────
// The static prefix (soul + skill instructions) is cached across turns; only
// live-context fetches and facts are re-evaluated each time they can change.
let _staticSysPrompt = null;
function invalidateStaticSysPrompt() { _staticSysPrompt = null; }

async function buildSystemPrompt() {
  if (!_staticSysPrompt) {
    const soul       = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
    const skillBlock = SKILLS.filter(s => s.instruction).map(s => s.instruction).join('\n\n');
    _staticSysPrompt = skillBlock ? soul + '\n\n' + skillBlock : soul;
  }
  const liveLines = (await Promise.all(SKILLS.filter(s => s.fetch).map(s => s.fetch()))).filter(Boolean);
  const facts     = await getFacts();
  let prompt = _staticSysPrompt;
  if (liveLines.length) prompt += '\n\n## Live context:\n' + liveLines.join('\n');
  if (facts.length)     prompt += '\n\n## Facts I recorded:\n' + facts.map(f => `- ${f.text}`).join('\n');
  return prompt;
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
let llm     = null;
let liteRtWarmup = null; // resolves when the post-init warm-up inference finishes

async function initAI(preferredBackend) {
  session = null;
  llm     = null;
  backend = 'none';
  if (!preferredBackend || preferredBackend === 'chrome') {
    if (await tryInitChrome()) return;
    if (preferredBackend === 'chrome') return;
  }
  if (preferredBackend === 'litert' || backend === 'none') {
    await tryInitLitert();
  }
}

function getChromeAIApi() {
  return window.ai?.languageModel
      ?? window.ai?.assistant
      ?? window.LanguageModel
      ?? null;
}

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
    return true;
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
      try {
        const fh   = await root.getFileHandle(filename);
        const file = await fh.getFile();
        if (file.size > 1e6) {
          setStatus(`Model ready from cache (${(file.size / 1e9).toFixed(1)} GB).`);
          return URL.createObjectURL(file);
        }
      } catch { /* not cached yet */ }

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

  setStatus('Downloading model (~2 GB) — no persistent cache in this context…');
  const res    = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total  = Number(res.headers.get('content-length') || 0);
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
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

// Estimate a sensible maxTokens from WebGPU VRAM headroom.
// WebGPU doesn't expose raw VRAM, but adapter.limits.maxBufferSize is a
// reliable proxy — drivers typically cap single-allocation size at ~50 % of
// usable VRAM, so multiplying by 2 gives a reasonable estimate.
// KV-cache cost for Gemma 4 2B at int8 with grouped-query attention: ~10 KB/token
// (1 KV head * 256 head_dim * 18 layers * 2 [K+V] * 1 byte ≈ 9 KB; round up to
// 10 KB to stay conservative and avoid OOM). Model weights occupy roughly 2 GB.
// PRACTICAL_CEIL caps at 16 K tokens — well above any real web chat session and
// avoids allocating multi-GB KV caches on high-VRAM GPUs that would hurt throughput.
async function computeMaxTokens() {
  const FLOOR          = 1000;
  const PRACTICAL_CEIL = 16384; // generous for real conversations, avoids VRAM waste
  const ABSOLUTE_CEIL  = 2 ** 17; // Gemma 4's architectural maximum
  try {
    if (!navigator.gpu) return FLOOR;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return FLOOR;
    const maxBuf           = adapter.limits.maxBufferSize ?? 256 * 1024 * 1024;
    const estimatedVram    = maxBuf * 2;
    const MODEL_BYTES      = 2 * 1024 ** 3;
    const KV_BYTES_PER_TOK = 10 * 1024;
    const headroom = estimatedVram - MODEL_BYTES;
    if (headroom <= 0) return FLOOR;
    const vramBased = Math.floor(headroom / KV_BYTES_PER_TOK);
    return Math.max(FLOOR, Math.min(vramBased, PRACTICAL_CEIL, ABSOLUTE_CEIL));
  } catch {
    return FLOOR;
  }
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
      maxTokens: await computeMaxTokens(),
      topK: 20,
      temperature: 0.8,
    });
    backend = 'litert';
    setStatus('Litert-LM ready.');
    // Pre-compile WebGPU shaders before the first real user message.
    // Tracked so streamAI can await it — LlmInference is not re-entrant.
    liteRtWarmup = llm.generateResponse(
      '<start_of_turn>user\nhi<end_of_turn>\n<start_of_turn>model\n', () => {}
    ).catch(() => {}).finally(() => { liteRtWarmup = null; });
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

// Build a Gemma instruction-tuned prompt.
// Gemma stops generation at <end_of_turn>, so using its native format prevents
// the model from continuing to write the next user turn by itself.
// The system prompt is injected into the first user turn (Gemma's convention).
// All prior messages are included so the model has multi-turn context.
function buildGemmaPrompt(systemPrompt, messages) {
  let out = '';
  for (let i = 0; i < messages.length; i++) {
    const { role, content } = messages[i];
    if (role === 'user') {
      out += '<start_of_turn>user\n';
      if (i === 0 && systemPrompt) out += systemPrompt + '\n\n';
      out += content + '<end_of_turn>\n<start_of_turn>model\n';
    } else {
      out += content + '<end_of_turn>\n';
    }
  }
  return out;
}

async function* streamAI(messages, systemPrompt) {
  if (backend === 'chrome') {
    const sess    = await getOrCreateSession(systemPrompt, messages);
    const lastMsg = messages.at(-1).content;
    if (typeof sess.promptStreaming === 'function') {
      // Each chunk is an incremental delta — yield directly.
      // (Older Chrome builds returned cumulative text, but current builds return deltas.)
      const EOT    = '<end_of_turn>';
      const stream = sess.promptStreaming(lastMsg);
      let held = '';
      for await (const chunk of stream) {
        if (!chunk) continue;
        held += chunk;
        const eotIdx = held.indexOf(EOT);
        if (eotIdx !== -1) {
          const clean = held.slice(0, eotIdx).trimEnd();
          if (clean) yield clean;
          return;
        }
        if (held.length >= EOT.length) {
          yield held.slice(0, -(EOT.length - 1));
          held = held.slice(-(EOT.length - 1));
        }
      }
      if (held) yield held.replace(/<end_of_turn>[\s\S]*$/, '').trimEnd();
    } else {
      const raw = await sess.prompt(lastMsg);
      yield (raw ?? '').replace(/<end_of_turn>[\s\S]*$/, '').trimEnd();
    }
  } else if (backend === 'litert') {
    if (liteRtWarmup) await liteRtWarmup; // ensure warm-up finished before we start
    const prompt = buildGemmaPrompt(systemPrompt, messages);
    const EOT    = '<end_of_turn>';

    // Bridge MediaPipe's callback-based streaming to this async generator.
    // Hold back EOT.length-1 chars at all times so a cross-chunk <end_of_turn>
    // is never emitted to the UI before we can strip it on the done=true call.
    const queue = [];
    let finished = false;
    let streamError = null;
    let wakeUp   = null;

    // generateResponse returns a Promise even in callback mode; catch rejections
    // so a failed inference wakes the loop instead of hanging indefinitely.
    llm.generateResponse(prompt, (partial, done) => {
      queue.push({ partial: partial ?? '', done });
      if (done) finished = true;
      wakeUp?.();
    }).catch(e => {
      streamError = e;
      finished = true;
      wakeUp?.();
    });

    let held = '';
    while (!finished || queue.length) {
      if (!queue.length) {
        await new Promise(r => { wakeUp = r; });
        wakeUp = null;
      }
      if (streamError) throw streamError;
      while (queue.length) {
        const { partial, done } = queue.shift();
        held += partial;
        // Check for EOT on every chunk — it can arrive with done=false, in which
        // case the hold-back slice would split the token across yields without this.
        const eotIdx = held.indexOf(EOT);
        if (eotIdx !== -1 || done) {
          const text  = eotIdx !== -1 ? held.slice(0, eotIdx) : held;
          const clean = text.trimEnd();
          yield clean || '[No response — check console]';
          return;
        }
        // >= EOT.length ensures we always hold back exactly EOT.length-1 chars.
        if (held.length >= EOT.length) {
          yield held.slice(0, -(EOT.length - 1));
          held = held.slice(-(EOT.length - 1));
        }
      }
    }
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
let messages  = [];
let chatId    = null;
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
  const text  = input.value.trim();
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

  let scrollPending = false;
  const scheduleScroll = () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      $('chat-messages').scrollTop = $('chat-messages').scrollHeight;
      scrollPending = false;
    });
  };

  // Maximum characters that can appear between '<' and '>' of any skill tag opening.
  // Used to detect when a '<' in the stream is definitely not a skill tag opener.
  const MAX_TAG_OVERHEAD = SKILLS.reduce((m, s) => Math.max(m, s.tag.length + 2), 32);

  // Incrementally emit safe text into the bubble. Holds back content from the
  // last '<' to guard against suppressing mid-stream skill tag openers.
  // O(|pending| * m) per chunk rather than O(n * m) — pending stays small.
  function emitChunk(chunk) {
    pending += chunk;
    for (const skill of SKILLS) {
      if (!pending.includes('<' + skill.tag + '>')) continue;
      const subst = skill.replace ?? (() => '');
      pending = pending.replace(
        new RegExp(`<${skill.tag}>([\\s\\S]*?)<\\/${skill.tag}>`, 'g'),
        (_, c) => subst(c.trim())
      );
    }
    const lastLt = pending.lastIndexOf('<');
    let safe;
    if (lastLt === -1) {
      safe = pending; pending = '';
    } else {
      // Check for a confirmed skill tag opener (e.g. '<fact>') in pending.
      // If found, hold from that position regardless of buffer size — we cannot
      // flush tag content until the closing tag arrives (regression guard).
      let openerAt = Infinity;
      for (const skill of SKILLS) {
        const idx = pending.indexOf('<' + skill.tag + '>');
        if (idx !== -1 && idx < openerAt) openerAt = idx;
      }
      if (openerAt < Infinity) {
        safe = pending.slice(0, openerAt); pending = pending.slice(openerAt);
      } else if (pending.length - lastLt > MAX_TAG_OVERHEAD) {
        // '<' too far back to be a tag opener — safe to flush
        safe = pending; pending = '';
      } else {
        safe = pending.slice(0, lastLt); pending = pending.slice(lastLt);
      }
    }
    if (safe) bubble.insertBefore(document.createTextNode(safe), cursor);
    scheduleScroll();
  }

  let pending  = '';
  let fullText = '';
  try {
    const sysPrompt = await buildSystemPrompt();

    // Pass 1
    for await (const chunk of streamAI(messages, sysPrompt)) {
      fullText += chunk;
      emitChunk(chunk);
    }

    // Collect results from any call() skills the model invoked
    const toolResults  = [];
    const invokedTools = new Set();
    for (const skill of SKILLS) {
      if (!skill.call) continue;
      const re = new RegExp(`<${skill.tag}>([\\s\\S]*?)<\\/${skill.tag}>`, 'g');
      let m;
      while ((m = re.exec(fullText)) !== null) {
        toolResults.push(`${skill.tag}: ${await skill.call(m[1].trim())}`);
        invokedTools.add(manifest.find(e => e.tag === skill.tag)?.label ?? skill.tag);
      }
    }

    if (toolResults.length) {
      // Pass 2: clear bubble, inject results, re-invoke so the model answers with real data
      bubble.textContent = '';
      bubble.appendChild(cursor); // textContent= removed cursor; restore it for pass 2
      pending = '';               // reset incremental buffer for pass 2
      setStatus('Running tools…');
      const pass1Clean = stripSkillTags(fullText).trim();
      const augmented  = [
        ...messages,
        ...(pass1Clean ? [{ role: 'assistant', content: pass1Clean }] : []),
        { role: 'user', content: `Tool results:\n${toolResults.join('\n')}\n\nNow answer using this data.` },
      ];
      fullText = '';
      session  = null; // force Chrome to rebuild session with augmented history
      for await (const chunk of streamAI(augmented, sysPrompt)) {
        fullText += chunk;
        emitChunk(chunk);
      }
      session = null; // discard augmented session; next turn rebuilds from real messages
    }

    const needsReset = await dispatchSkillCalls(fullText);
    if (needsReset) session = null;

    const cleanText = stripSkillTags(fullText);
    bubble.textContent = cleanText;
    if (invokedTools.size) {
      const badge = document.createElement('span');
      badge.className = 'tool-badge';
      badge.dataset.tooltip = [...invokedTools].join(', ');
      badge.innerHTML = '<i class="bi bi-tools"></i>';
      bubble.appendChild(badge);
    }
    messages.push({ role: 'assistant', content: cleanText });

    const title = messages[0].content.slice(0, 48);
    chatId = await persistChat(chatId, messages, title);
    await renderHistory();
  } catch (e) {
    bubble.textContent = `[Error: ${e.message}]`;
    console.error(e);
  }

  generating = false;
  setSend(true);
  document.body.classList.remove('thinking');
  setStatus(backend === 'none' ? 'No AI backend.' : `Ready · ${backend}`);
}

// Strip all skill tags from display text; also suppresses incomplete opening
// tags that haven't closed yet (mid-stream).
function stripSkillTags(text) {
  let out = text;
  for (const skill of SKILLS) {
    const subst = skill.replace ?? (() => '');
    out = out
      .replace(new RegExp(`<${skill.tag}>([\\s\\S]*?)<\\/${skill.tag}>`, 'g'),
               (_, content) => subst(content.trim()))
      .replace(new RegExp(`<${skill.tag}>[\\s\\S]*$`), '');
  }
  return out;
}

// Returns true if any skill handler signalled a session reset is needed.
async function dispatchSkillCalls(text) {
  let needsReset = false;
  for (const skill of SKILLS) {
    if (!skill.handle) continue;
    const re = new RegExp(`<${skill.tag}>([\\s\\S]*?)<\\/${skill.tag}>`, 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      const result = await skill.handle(m[1].trim());
      if (result === true) needsReset = true;
    }
  }
  return needsReset;
}

// ── Chat history UI ───────────────────────────────────────────────────────────
async function renderHistory() {
  const all = await txAll('chats');
  const el  = $('chat-history');
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
  chatId   = chat.id;
  messages = chat.messages ?? [];
  session  = null;
  $('chat-title').textContent = chat.title;
  $('chat-messages').innerHTML = '';
  messages.forEach(m => appendBubble(m.role, m.content));
  await renderHistory();
}

function newChat() {
  chatId   = null;
  messages = [];
  session  = null;
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
      session = null;
      await renderMemory();
    });
    el.appendChild(row);
  });
}

// ── Skills UI ─────────────────────────────────────────────────────────────────
async function renderSkills() {
  const enabled = await getEnabledSkills();
  const el      = $('skills-list');
  el.innerHTML  = '';
  for (const entry of manifest) {
    const isEnabled  = enabled.has(entry.tag);
    const loaded     = SKILLS.find(s => s.tag === entry.tag);
    const approxTokens = loaded?.instruction
      ? Math.round(loaded.instruction.split(/\s+/).length * 1.33)
      : 0;
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <div class="skill-info">
        <span class="skill-name">${esc(entry.label)}</span>
        ${approxTokens ? `<small class="skill-tokens">~${approxTokens.toLocaleString()} tokens</small>` : ''}
        <span class="skill-desc">${esc(entry.description)}</span>
      </div>
      <label class="toggle" title="${isEnabled ? 'Disable' : 'Enable'} ${esc(entry.label)}">
        <input type="checkbox" data-tag="${entry.tag}"${isEnabled ? ' checked' : ''}>
        <span class="toggle-track"></span>
      </label>`;
    row.querySelector('input').addEventListener('change', async e => {
      const cur = await getEnabledSkills();
      if (e.target.checked) {
        await loadSkill(entry.tag);
        cur.add(entry.tag);
      } else {
        unloadSkill(entry.tag);
        cur.delete(entry.tag);
      }
      await setEnabledSkills(cur);
      session = null;
      await renderSkills(); // refresh token counts after load
    });
    el.appendChild(row);
  }

  const maxTok = await computeMaxTokens();
  const src    = navigator.gpu
    ? 'estimated from WebGPU VRAM'
    : 'WebGPU unavailable — using minimum fallback';
  $('context-window-note').textContent =
    `Context window on this device: ~${maxTok.toLocaleString()} tokens (${src}).`;
}

// ── Todos UI ──────────────────────────────────────────────────────────────────
async function renderTodos() {
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

// ── Theme ─────────────────────────────────────────────────────────────────────
(function initTheme() {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch { /* storage blocked */ }
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  else saved = null; // ignore any invalid stored value
  const isDark = saved === 'dark' ||
    (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const btn = $('theme-toggle');
  if (btn) btn.querySelector('i').className = isDark ? 'bi bi-sun' : 'bi bi-moon';
})();

$('theme-toggle').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme;
  const isDark = cur === 'dark' ||
    (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* storage blocked */ }
  $('theme-toggle').querySelector('i').className = next === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
});

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
  const text  = input.value.trim();
  if (!text) return;
  await addFact(text);
  input.value = '';
  session = null;
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

$('save-soul-btn').addEventListener('click', async () => {
  await txPut('settings', $('soul-editor').value, 'soul');
  invalidateStaticSysPrompt();
  session = null;
  bootstrap.Modal.getInstance($('settingsModal')).hide();
});
$('reset-soul-btn').addEventListener('click', async () => {
  await txPut('settings', DEFAULT_SOUL, 'soul');
  $('soul-editor').value = DEFAULT_SOUL;
  invalidateStaticSysPrompt();
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
  const gpuOk    = 'gpu' in navigator;
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
  await renderSkills();
  await renderTodos();
  $('soul-editor').value = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
});

// ── Boot ──────────────────────────────────────────────────────────────────────
// initAI and initSkills are independent — skills are only used at inference time,
// not during model loading. Run them in parallel so the tool registry is populated
// as soon as the manifest is fetched rather than waiting for model init.
const savedBackend = await txGet('settings', 'backend');
await Promise.all([initAI(savedBackend), initSkills()]);
await renderHistory();
setSend(false);
$('user-input').dispatchEvent(new Event('input'));
