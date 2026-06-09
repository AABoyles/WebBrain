// Exports: backend, thinkingMode, setThinkingMode, initAI, streamAI, computeMaxTokens, resetSession, destroySession
import { txGet } from '../tools/db.js';
import { setStatus } from './utils.js';

const DEFAULT_MODEL_URL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task';

// ── AI Backend ────────────────────────────────────────────────────────────────
export let backend      = 'none';
export let contextMax   = 0;
export let thinkingMode = false;
let llm             = null;
let liteRtWarmup    = null;
let litertGenPromise = null;

export function setThinkingMode(v) { thinkingMode = !!v; }

// No-ops kept for call-site compatibility; session concept was Chrome AI only.
export function destroySession() {}
export function resetSession() {}

export async function initAI() {
  llm     = null;
  backend = 'none';
  thinkingMode = !!(await txGet('settings', 'thinkingMode'));
  await tryInitLitert();
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
      '<|turn>user\nhi<turn|>\n<|turn>model\n', () => {}
    ).catch(() => {}).finally(() => { liteRtWarmup = null; });
  } catch (e) {
    console.error('Litert-LM init failed:', e);
    setStatus(`Litert-LM failed: ${e.message}`);
  }
}

// Stop sequences: Gemma 4 uses <turn|> / <|turn> as turn delimiters. Old Gemma 1/2/3
// tokens are kept as a fallback in case the compiled .task file uses them.
const STOP_SEQS    = ['<turn|>', '<|turn>', '<end_of_turn>', '<start_of_turn>', '<|tool_response>'];
const MAX_HOLD_LEN = Math.max(...STOP_SEQS.map(s => s.length)) - 1; // chars to hold back

function findEarliestStop(text) {
  return STOP_SEQS.reduce((min, s) => {
    const i = text.indexOf(s);
    return i !== -1 && i < min ? i : min;
  }, Infinity);
}

// Build a Gemma 4 instruction-tuned prompt matching the official chat_template.jinja.
// System prompt gets its own <|turn>system block. Tool responses are appended inline
// to the preceding model turn (per template), not emitted as a separate user turn.
function buildGemmaPrompt(systemPrompt, messages) {
  let out = '';
  if (systemPrompt) {
    out += '<|turn>system\n' + systemPrompt + '<turn|>\n';
  }
  for (let i = 0; i < messages.length; i++) {
    const { role, content } = messages[i];
    const next = messages[i + 1];
    if (role === 'user') {
      out += '<|turn>user\n' + content + '<turn|>\n<|turn>model\n';
    } else if (role === 'assistant') {
      // Keep the model turn open if a tool response immediately follows
      if (next?.role === 'tool') {
        out += content;
      } else {
        out += content + '<turn|>\n';
      }
    } else if (role === 'tool') {
      // Close the model turn after the inline tool response, then open a new one
      out += content + '<turn|>\n<|turn>model\n';
    }
  }
  return out;
}

// Wraps an async iterable and discards any leading Gemma 4 thinking channel block.
// Gemma 4 wraps reasoning in <|channel>thought\n...\n<channel|>. Everything before
// <channel|> is buffered and dropped; content after streams normally.
// If <channel|> is never emitted the model didn't think — the full buffer is yielded
// at the end so normal responses are never lost.
async function* filterThinkingBlock(source) {
  const CLOSE     = '<channel|>';
  const CLOSE_LEN = CLOSE.length;
  let buf  = '';
  let past = false;
  for await (const chunk of source) {
    if (!chunk) continue;
    if (past) { yield chunk; continue; }
    buf += chunk;
    const i = buf.indexOf(CLOSE);
    if (i !== -1) {
      past = true;
      const after = buf.slice(i + CLOSE_LEN).trimStart();
      if (after) yield after;
      buf = '';
    }
  }
  if (!past && buf) yield buf;
}

export async function* streamAI(messages, systemPrompt) {
  if (thinkingMode) {
    yield* filterThinkingBlock(_coreStream(messages, systemPrompt));
  } else {
    yield* _coreStream(messages, systemPrompt);
  }
}

async function* _coreStream(messages, systemPrompt) {
  if (backend === 'litert') {
    if (liteRtWarmup) await liteRtWarmup;
    if (litertGenPromise) await litertGenPromise.catch(() => {});
    const prompt = buildGemmaPrompt(systemPrompt, messages);

    // Hard cap on response length: rough 4 chars/token heuristic, min 4000 chars.
    const MAX_RESPONSE_CHARS = Math.max(4000, contextMax * 4);

    const queue = [];
    let finished   = false;
    let streamError = null;
    let wakeUp      = null;
    let totalChars  = 0;

    const genPromise = llm.generateResponse(prompt, (partial, done) => {
      queue.push({ partial: partial ?? '', done });
      if (done) finished = true;
      wakeUp?.();
    });
    litertGenPromise = genPromise;
    genPromise.catch(e => {
      streamError = e;
      finished = true;
      wakeUp?.();
    }).finally(() => {
      if (litertGenPromise === genPromise) litertGenPromise = null;
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
        totalChars += partial.length;
        const stopAt   = findEarliestStop(held);
        const overlong = totalChars > MAX_RESPONSE_CHARS;
        if (stopAt !== Infinity || done || overlong) {
          const text  = stopAt !== Infinity ? held.slice(0, stopAt) : held;
          const clean = text.trimEnd();
          yield clean || '[No response — check console]';
          return;
        }
        if (held.length >= MAX_HOLD_LEN) {
          yield held.slice(0, -MAX_HOLD_LEN);
          held = held.slice(-MAX_HOLD_LEN);
        }
      }
    }
  } else {
    yield 'No AI backend is configured. Open Settings → Model to set one up.';
  }
}
