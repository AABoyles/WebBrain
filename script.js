// ── Constants ─────────────────────────────────────────────────────────────────
const DB_NAME = 'webbrain';
const DB_VERSION = 2;
const DEFAULT_SOUL = `You are WebBrain, a helpful AI assistant running entirely in the user's browser. Be concise, clear, and friendly. You may ask questions, but no more than one per turn. You output plaintext, not markdown.`;

// ── Skills ────────────────────────────────────────────────────────────────────
// Each skill owns: the XML tag the model emits, the instruction fragment injected
// into the system prompt, and a handle() that runs when a complete tag is parsed.
const SKILLS = [
  {
    tag: 'fact',
    label: 'Memory',
    description: 'Saves personal details shared in conversation as persistent facts.',
    instruction: `MEMORY SKILL: Any time the user shares anything meaningful — personal details, opinions, beliefs, preferences, relationships, projects, goals, values, or anything they express strong interest or feeling about — you MUST append one or more <fact> tags at the very end of your reply. Each tag contains one short third-person sentence. Never skip this even if the fact seems minor.

Examples (always append AFTER your normal reply):
- "My name is Alice." → <fact>User's name is Alice.</fact>
- "I work as a nurse in Seattle." → <fact>User works as a nurse.</fact><fact>User lives in Seattle.</fact>
- "I love hiking but hate crowds." → <fact>User loves hiking.</fact><fact>User dislikes crowds.</fact>
- "I think most social media is harmful." → <fact>User believes most social media is harmful.</fact>
- "I'm building a home automation system." → <fact>User is building a home automation system.</fact>
- "Privacy is really important to me." → <fact>User strongly values privacy.</fact>
- "I want to retire early." → <fact>User's goal is to retire early.</fact>`,
    async handle(content) {
      const existing = await getFacts();
      const seen = new Set(existing.map(f => f.text.trim().toLowerCase()));
      if (!seen.has(content.toLowerCase())) {
        await addFact(content);
        session = null; // force system-prompt rebuild with new fact
      }
    },
  },
  {
    tag: 'date',
    label: 'Date Awareness',
    description: 'Lets the model look up the current date and time on demand.',
    instruction: `DATE SKILL: When the user asks about the current date, time, day of the week, or anything time-dependent, emit <date></date> in your reply and stop. Do not guess the date.

Examples:
- "What's today's date?" → "Today is <date></date>."
- "What time is it?" → "The current time is <date></date>."`,
    // call() triggers two-pass: pass 1 lets the model request the data,
    // pass 2 runs with the real value injected so the model answers organically.
    call: () => new Date().toLocaleString(),
    // replace() is a silent fallback if the model emits the tag in pass 2 anyway
    replace: () => new Date().toLocaleString(),
    async handle() {},
  },
  {
    tag: 'calc',
    label: 'Calculator',
    description: 'Evaluates math expressions precisely using the JS engine — no hallucination.',
    instruction: `CALCULATOR SKILL: For any arithmetic or math, emit <calc>JS expression</calc> — do NOT compute yourself. Use Math.* for functions.

Examples:
- "17 × 23?" → <calc>17 * 23</calc>
- "√144?" → <calc>Math.sqrt(144)</calc>
- "15% of $47.50?" → <calc>(47.5 * 0.15).toFixed(2)</calc>`,
    call: (expr) => {
      const blocked = /\b(window|document|fetch|XMLHttpRequest|eval|Function|import|require|process|global|setTimeout|setInterval|clearTimeout|clearInterval|Worker|Blob|URL|indexedDB|localStorage|sessionStorage|navigator|location|history|crypto|performance|console)\b/;
      if (blocked.test(expr) || /[`]/.test(expr)) return 'Error: disallowed expression';
      try {
        // eslint-disable-next-line no-new-func
        const result = new Function('"use strict"; return (' + expr + ')')();
        return typeof result === 'number'
          ? (isFinite(result) ? parseFloat(result.toPrecision(10)).toString() : String(result))
          : String(result);
      } catch (e) {
        return 'Math error: ' + e.message;
      }
    },
    async handle() {},
  },
  {
    tag: 'remind',
    label: 'Reminders',
    description: 'Sets timed browser notifications. Emit tag AFTER your reply text.',
    instruction: `REMINDER SKILL: When asked to be reminded of something, emit <remind>delay:message</remind> AFTER your natural reply. Delay uses h/m/s (e.g. "20m", "1h", "1h30m").

Examples:
- "Remind me in 20 min to check the oven" → Sure! I'll alert you in 20 minutes. <remind>20m:Check the oven</remind>
- "Set an alarm for 2 hours" → Done. <remind>2h:Your alarm</remind>`,
    async handle(content) {
      const m = content.match(/^([^:]+):(.+)$/s);
      if (!m) return;
      const ms = parseDelay(m[1].trim());
      if (!ms) return;
      const message = m[2].trim();
      if (Notification.permission === 'default') await Notification.requestPermission();
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('WebBrain Reminder', { body: message });
        } else {
          alert('Reminder: ' + message);
        }
      }, ms);
    },
  },
  {
    tag: 'todo',
    label: 'To-Do List',
    description: 'Manages a persistent to-do list stored in your browser.',
    instruction: `TODO SKILL: Manage tasks with <todo>command</todo>. Commands: list, add:text, done:ID, delete:ID.

Examples:
- "Show my todos" → <todo>list</todo>
- "Add 'buy milk'" → <todo>add:Buy milk</todo>
- "Mark task 3 done" → <todo>done:3</todo>`,
    call: async (content) => {
      const cmd = content.trim();
      if (cmd === 'list') {
        const open = (await getTodos()).filter(t => !t.done);
        return open.length ? open.map(t => `#${t.id}: ${t.text}`).join('\n') : 'No open tasks.';
      }
      if (cmd.startsWith('add:')) {
        const text = cmd.slice(4).trim();
        if (!text) return 'No task text provided.';
        const id = await addTodo(text);
        return `Added task #${id}: "${text}"`;
      }
      if (cmd.startsWith('done:')) {
        const id = parseInt(cmd.slice(5));
        await setTodoDone(id, true);
        return `Marked #${id} done.`;
      }
      if (cmd.startsWith('delete:')) {
        const id = parseInt(cmd.slice(7));
        await deleteTodo(id);
        return `Deleted task #${id}.`;
      }
      return 'Commands: list, add:text, done:ID, delete:ID';
    },
    async handle() {},
  },
  {
    tag: 'convert',
    label: 'Unit Converter',
    description: 'Converts between length, mass, temperature, volume, speed, area, and data units.',
    instruction: `UNIT CONVERTER SKILL: For unit conversions, emit <convert>VALUE UNIT to UNIT</convert>. Do not guess.

Examples:
- "5 miles in km?" → <convert>5 mi to km</convert>
- "100°F in Celsius?" → <convert>100 F to C</convert>
- "2.5 kg to pounds?" → <convert>2.5 kg to lb</convert>`,
    call: (content) => convertUnits(content),
    async handle() {},
  },
  {
    tag: 'wiki',
    label: 'Wikipedia',
    description: 'Fetches a real Wikipedia summary instead of hallucinating facts.',
    instruction: `WIKIPEDIA SKILL: For questions about people, places, events, or concepts, emit <wiki>Article Title</wiki> to get a real summary before answering.

Examples:
- "Who was Marie Curie?" → <wiki>Marie Curie</wiki>
- "What is quantum entanglement?" → <wiki>Quantum entanglement</wiki>`,
    call: async (title) => {
      try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.trim())}`);
        if (!res.ok) return `No Wikipedia article found for "${title}".`;
        const { extract } = await res.json();
        if (!extract) return 'No summary available.';
        return extract.length > 600 ? extract.slice(0, 597) + '…' : extract;
      } catch (e) {
        return `Wikipedia fetch failed: ${e.message}`;
      }
    },
    async handle() {},
  },
  {
    tag: 'location',
    label: 'Location',
    description: 'Gets your approximate location for context-aware answers.',
    instruction: `LOCATION SKILL: For questions about local weather, time zones, or nearby places, emit <location></location> to get the user's position first.

Examples:
- "What's the weather here?" → Let me check your location. <location></location>
- "What time zone am I in?" → <location></location>`,
    call: () => new Promise(resolve => {
      if (!navigator.geolocation) return resolve('Geolocation not available in this browser.');
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude: lat, longitude: lon } }) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const { address: a } = await res.json();
            const place = [a?.city || a?.town || a?.village || a?.county, a?.state, a?.country]
              .filter(Boolean).join(', ');
            resolve(`${place} (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`);
          } catch {
            resolve(`${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
          }
        },
        err => resolve(`Location unavailable: ${err.message}`)
      );
    }),
    async handle() {},
  },
];

const DEFAULT_MODEL_URL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task';

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = ({ target: { result: d } }) => {
      if (!d.objectStoreNames.contains('facts')) d.createObjectStore('facts', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('chats')) d.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings');
      if (!d.objectStoreNames.contains('todos')) d.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
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

// ── Skill toggles ─────────────────────────────────────────────────────────────
async function getDisabledSkills() {
  const raw = await txGet('settings', 'disabledSkills');
  return new Set(raw ? JSON.parse(raw) : []);
}
async function setDisabledSkills(set) {
  await txPut('settings', JSON.stringify([...set]), 'disabledSkills');
}

// ── Memory ────────────────────────────────────────────────────────────────────
const getFacts = () => txAll('facts');
const addFact = text => txAdd('facts', { text, created: Date.now() });
const deleteFact = id => txDelete('facts', id);
const clearFacts = () => txClear('facts');

// ── Todos ─────────────────────────────────────────────────────────────────────
const getTodos = () => txAll('todos');
const addTodo = text => txAdd('todos', { text, done: false, created: Date.now() });
const setTodoDone = (id, done) => txGet('todos', id).then(t => txPut('todos', { ...t, done }));
const deleteTodo = id => txDelete('todos', id);
const clearDoneTodos = async () => {
  const done = (await getTodos()).filter(t => t.done);
  await Promise.all(done.map(t => txDelete('todos', t.id)));
};

// ── Skill helpers ─────────────────────────────────────────────────────────────
function parseDelay(str) {
  let ms = 0;
  for (const [, n, unit] of str.matchAll(/(\d+(?:\.\d+)?)\s*(h|m|s)/gi)) {
    switch (unit.toLowerCase()) {
      case 'h': ms += parseFloat(n) * 3_600_000; break;
      case 'm': ms += parseFloat(n) * 60_000; break;
      case 's': ms += parseFloat(n) * 1_000; break;
    }
  }
  return ms || null;
}

function convertUnits(expr) {
  const m = expr.trim().match(/^(-?[\d.]+(?:[eE][+\-]?\d+)?)\s+(.+?)\s+to\s+(.+)$/i);
  if (!m) return 'Format: VALUE UNIT to UNIT — e.g. "5 mi to km"';
  const value = parseFloat(m[1]);
  if (isNaN(value)) return 'Invalid number.';
  const from = m[2].trim().toLowerCase().replace(/°/g, '');
  const to   = m[3].trim().toLowerCase().replace(/°/g, '');

  // Temperature (non-linear)
  const TEMP_IDX = { c: 0, celsius: 0, f: 1, fahrenheit: 1, k: 2, kelvin: 2 };
  if (from in TEMP_IDX && to in TEMP_IDX) {
    const toC   = [v => v, v => (v - 32) * 5 / 9, v => v - 273.15];
    const fromC = [v => v, v => v * 9 / 5 + 32, v => v + 273.15];
    const result = fromC[TEMP_IDX[to]](toC[TEMP_IDX[from]](value));
    return `${value} ${m[2]} = ${+result.toFixed(4)} ${m[3]}`;
  }

  // Linear tables — each key maps to its SI-base multiplier
  const TABLES = [
    // Length (metres)
    { mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 },
    // Mass (kg)
    { mg: 1e-6, g: 1e-3, kg: 1, t: 1e3, lb: 0.45359237, lbs: 0.45359237, oz: 0.02834952, st: 6.35029318 },
    // Volume (litres)
    { ml: 1e-3, cl: 0.01, dl: 0.1, l: 1, litre: 1, liter: 1, tsp: 4.92892e-3, tbsp: 0.01478676, floz: 0.02957353, cup: 0.23658824, cups: 0.23658824, pt: 0.47317647, qt: 0.94635295, gal: 3.78541178 },
    // Speed (m/s)
    { 'm/s': 1, 'km/h': 1/3.6, kmh: 1/3.6, kph: 1/3.6, mph: 0.44704, kn: 0.514444, kt: 0.514444, knots: 0.514444, 'ft/s': 0.3048 },
    // Area (m²)
    { mm2: 1e-6, cm2: 1e-4, m2: 1, km2: 1e6, in2: 6.4516e-4, ft2: 0.09290304, yd2: 0.83612736, mi2: 2.58999e6, acre: 4046.8564, acres: 4046.8564, ha: 1e4 },
    // Data (bytes)
    { b: 1, byte: 1, bytes: 1, kb: 1024, mb: 1024**2, gb: 1024**3, tb: 1024**4, kib: 1024, mib: 1024**2, gib: 1024**3, tib: 1024**4 },
  ];

  for (const table of TABLES) {
    if (table[from] !== undefined && table[to] !== undefined) {
      const result = (value * table[from]) / table[to];
      return `${value} ${m[2]} = ${+result.toPrecision(7)} ${m[3]}`;
    }
  }
  return `Cannot convert "${m[2]}" to "${m[3]}".`;
}

async function buildSystemPrompt() {
  const soul = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
  const disabled = await getDisabledSkills();
  const active = SKILLS.filter(s => !disabled.has(s.tag));
  const skillBlock = active.filter(s => s.instruction).map(s => s.instruction).join('\n\n');
  const liveLines = (await Promise.all(active.filter(s => s.fetch).map(s => s.fetch())))
    .filter(Boolean);
  const facts = await getFacts();
  let prompt = soul;
  if (skillBlock) prompt += '\n\n' + skillBlock;
  if (liveLines.length) prompt += '\n\n## Live context:\n' + liveLines.join('\n');
  if (facts.length) prompt += '\n\n## Facts I recorded:\n' + facts.map(f => `- ${f.text}`).join('\n');
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

// Estimate a sensible maxTokens from WebGPU VRAM headroom.
// WebGPU doesn't expose raw VRAM, but adapter.limits.maxBufferSize is a
// reliable proxy — drivers typically cap single-allocation size at ~50 % of
// usable VRAM, so multiplying by 2 gives a reasonable estimate.
// KV-cache cost for a Gemma-class 2 B model at int8: ~20 KB / token.
// Model weights occupy roughly 2 GB, leaving the rest for KV cache.
async function computeMaxTokens() {
  const FLOOR = 1000;
  const CEIL  = 2**17; //Gemma 4's maximum context length
  try {
    if (!navigator.gpu) return FLOOR;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return FLOOR;

    const maxBuf = adapter.limits.maxBufferSize ?? 256 * 1024 * 1024;
    const estimatedVram     = maxBuf * 2;
    const MODEL_BYTES       = 2 * 1024 ** 3;          // ~2 GB weights
    const KV_BYTES_PER_TOK  = 20 * 1024;              // ~20 KB / token
    const headroom = estimatedVram - MODEL_BYTES;
    if (headroom <= 0) return FLOOR;
    return Math.max(FLOOR, Math.min(Math.floor(headroom / KV_BYTES_PER_TOK), CEIL));
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
      const stream = sess.promptStreaming(lastMsg);
      for await (const chunk of stream) {
        if (chunk) yield chunk;
      }
    } else {
      // Older builds only expose prompt() (non-streaming)
      yield await sess.prompt(lastMsg);
    }

  } else if (backend === 'litert') {
    const prompt   = buildGemmaPrompt(systemPrompt, messages);
    const raw      = await llm.generateResponse(prompt);
    // Strip the end-of-turn token if the model echoes it back
    const response = (raw ?? '').replace(/<end_of_turn>[\s\S]*$/, '').trim();
    yield response || '[No response — check console]';

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
    const disabled = await getDisabledSkills();
    const activeSkills = SKILLS.filter(s => !disabled.has(s.tag));

    // Pass 1
    for await (const chunk of streamAI(messages, sysPrompt)) {
      fullText += chunk;
      bubble.textContent = stripSkillTags(fullText);
      bubble.appendChild(cursor);
      $('chat-messages').scrollTop = $('chat-messages').scrollHeight;
    }

    // Collect results from any call() skills the model invoked
    const toolResults = [];
    for (const skill of activeSkills) {
      if (!skill.call) continue;
      const re = new RegExp(`<${skill.tag}>([\\s\\S]*?)<\\/${skill.tag}>`, 'g');
      let m;
      while ((m = re.exec(fullText)) !== null) {
        toolResults.push(`${skill.tag}: ${await skill.call(m[1].trim())}`);
      }
    }

    if (toolResults.length) {
      // Pass 2: clear bubble, inject results, re-invoke so the model answers with real data
      bubble.textContent = '';
      setStatus('Running tools…');
      const pass1Clean = stripSkillTags(fullText).trim();
      const augmented = [
        ...messages,
        ...(pass1Clean ? [{ role: 'assistant', content: pass1Clean }] : []),
        { role: 'user', content: `Tool results:\n${toolResults.join('\n')}\n\nNow answer using this data.` },
      ];
      fullText = '';
      session = null; // force Chrome to rebuild session with augmented history
      for await (const chunk of streamAI(augmented, sysPrompt)) {
        fullText += chunk;
        bubble.textContent = stripSkillTags(fullText);
        bubble.appendChild(cursor);
        $('chat-messages').scrollTop = $('chat-messages').scrollHeight;
      }
      session = null; // discard augmented session; next turn rebuilds from real messages
    }

    await dispatchSkillCalls(fullText, activeSkills);
    const cleanText = stripSkillTags(fullText);
    bubble.textContent = cleanText;
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

async function dispatchSkillCalls(text, skills = SKILLS) {
  for (const skill of skills) {
    const re = new RegExp(`<${skill.tag}>([\\s\\S]*?)<\\/${skill.tag}>`, 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      const content = m[1].trim();
      if (content) await skill.handle(content);
    }
  }
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

// ── Skills UI ─────────────────────────────────────────────────────────────────
async function renderSkills() {
  const disabled = await getDisabledSkills();
  const el = $('skills-list');
  el.innerHTML = '';
  for (const skill of SKILLS) {
    const enabled = !disabled.has(skill.tag);
    // Rough token estimate: words × 1.33 (average English word-to-token ratio)
    const approxTokens = skill.instruction
      ? Math.round(skill.instruction.split(/\s+/).length * 1.33)
      : 0;
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <div class="skill-info">
        <span class="skill-name">${esc(skill.label ?? skill.tag)}</span>
        ${approxTokens ? `<small class="skill-tokens">~${approxTokens.toLocaleString()} tokens</small>` : ''}
        <span class="skill-desc">${esc(skill.description ?? '')}</span>
      </div>
      <label class="toggle" title="${enabled ? 'Disable' : 'Enable'} ${esc(skill.label ?? skill.tag)}">
        <input type="checkbox" data-tag="${skill.tag}"${enabled ? ' checked' : ''}>
        <span class="toggle-track"></span>
      </label>`;
    row.querySelector('input').addEventListener('change', async e => {
      const d = await getDisabledSkills();
      if (e.target.checked) d.delete(skill.tag);
      else d.add(skill.tag);
      await setDisabledSkills(d);
      session = null;
    });
    el.appendChild(row);
  }

  const maxTok = await computeMaxTokens();
  const src = navigator.gpu
    ? 'estimated from WebGPU VRAM'
    : 'WebGPU unavailable — using minimum fallback';
  $('context-window-note').textContent =
    `Context window on this device: ~${maxTok.toLocaleString()} tokens (${src}).`;
}

// ── Todos UI ──────────────────────────────────────────────────────────────────
async function renderTodos() {
  const todos = await getTodos();
  const el = $('todo-list');
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

$('clear-done-btn').addEventListener('click', async () => {
  await clearDoneTodos();
  await renderTodos();
});
$('add-todo-btn').addEventListener('click', async () => {
  const input = $('new-todo');
  const text = input.value.trim();
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
  await renderSkills();
  await renderTodos();
  $('soul-editor').value = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
});

// ── Boot ──────────────────────────────────────────────────────────────────────
const savedBackend = await txGet('settings', 'backend');
await initAI(savedBackend);
await renderHistory();
setSend(false);
$('user-input').dispatchEvent(new Event('input'));
