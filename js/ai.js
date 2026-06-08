// Exports: backend, initAI, checkChromeAI, streamAI, computeMaxTokens, resetSession, destroySession
import { txGet } from '../skills/db.js';
import { setStatus } from './utils.js';

const DEFAULT_MODEL_URL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task';

// ── AI Backend ────────────────────────────────────────────────────────────────
export let backend    = 'none';
export let contextMax = 0;
let session = null;
let llm     = null;
let liteRtWarmup = null;

// Call session.destroy() before nulling so Chrome AI releases its internal
// resources immediately. Plain `session = null` only drops our JS reference
// while Chrome considers the session live, causing "still ongoing" errors
// when a new session is created right after.
export function destroySession() {
  if (session) {
    try { session.destroy(); } catch {}
    session = null;
  }
}

// Soft reset — forces a new session on the next turn without destroying the
// current one (which may still be in use mid-stream).
export function resetSession() { session = null; }

export async function initAI(preferredBackend) {
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

export async function checkChromeAI() {
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
      contextMax = caps.defaultMaxTokens ?? caps.maxTokens ?? 4096;
    } else {
      contextMax = 4096;
    }
    backend = 'chrome';
    setStatus('Chrome Built-in AI ready.');
    return true;
  } catch { return false; }
}

// ── OPFS model cache ──────────────────────────────────────────────────────────
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
export async function computeMaxTokens() {
  const FLOOR          = 1000;
  const PRACTICAL_CEIL = 16384;
  const ABSOLUTE_CEIL  = 2 ** 17;
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
    const maxTokens = await computeMaxTokens();
    contextMax = maxTokens;
    llm = await LlmInference.createFromOptions(genai, {
      baseOptions: { modelAssetPath: modelUrl },
      maxTokens,
      topK: 20,
      temperature: 0.8,
    });
    backend = 'litert';
    setStatus('Litert-LM ready.');
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

export async function* streamAI(messages, systemPrompt) {
  if (backend === 'chrome') {
    const sess    = await getOrCreateSession(systemPrompt, messages);
    const lastMsg = messages.at(-1).content;
    if (typeof sess.promptStreaming === 'function') {
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
    if (liteRtWarmup) await liteRtWarmup;
    const prompt = buildGemmaPrompt(systemPrompt, messages);
    const EOT    = '<end_of_turn>';

    const queue = [];
    let finished = false;
    let streamError = null;
    let wakeUp   = null;

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
        const eotIdx = held.indexOf(EOT);
        if (eotIdx !== -1 || done) {
          const text  = eotIdx !== -1 ? held.slice(0, eotIdx) : held;
          const clean = text.trimEnd();
          yield clean || '[No response — check console]';
          return;
        }
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
