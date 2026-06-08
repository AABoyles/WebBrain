// Exports: messages, chatId, generating, perfHistory, clearPerfHistory, send,
//          appendBubble, clearWelcome, stripSkillTags, dispatchSkillCalls,
//          renderHistory, loadChat, newChat
import { $, esc, setStatus, setSend, autoResize, estimateTokens, DEFAULT_SOUL } from './utils.js';
import {
  SKILLS, manifest, knownSkillTags,
  planSkillsForTurn, buildSystemPrompt,
  loadSkillsByTag, getLoadedSkillsByTag, findInvokedSkillTags,
} from './skills.js';
import { backend, streamAI, resetSession, contextMax } from './ai.js';
import { txGet, txAdd, txPut, txAll, txDelete } from '../skills/db.js';

// ── Chat storage ──────────────────────────────────────────────────────────────
async function persistChat(id, msgs, title) {
  if (id) {
    const existing = await txGet('chats', id);
    await txPut('chats', { ...existing, messages: msgs, title: title ?? existing.title, updated: Date.now() });
    return id;
  }
  return txAdd('chats', { messages: msgs, title: title ?? 'New Chat', created: Date.now(), updated: Date.now() });
}

// ── Messages ──────────────────────────────────────────────────────────────────
export let messages  = [];
export let chatId    = null;
export let generating = false;

// ── Performance Metrics ───────────────────────────────────────────────────────
export let perfHistory = [];
let currentPerf = null;

function newPerfRecord() {
  return {
    ts: Date.now(),
    backend: '',
    tokensInSystem: 0,
    tokensInSkills: 0,
    tokensInUser: 0,
    tokensOutSkillCalls: 0,
    tokensOutUser: 0,
    ttft: null,
    itl: null,
    genMs: 0,
    passes: 1,
  };
}

export function clearPerfHistory() { perfHistory = []; }

export function clearWelcome() { const w = $('welcome'); if (w) w.remove(); }

// ── Context Window Management ─────────────────────────────────────────────────
const CONTEXT_WARN_RATIO = 0.95;
let _ctxStrategyResolve = null;

export function resolveContextStrategy(strategy) {
  _ctxStrategyResolve?.(strategy);
  _ctxStrategyResolve = null;
}

function promptContextStrategy(ratio) {
  return new Promise(resolve => {
    _ctxStrategyResolve = resolve;
    $('ctx-usage-pct').textContent = Math.round(ratio * 100) + '%';
    bootstrap.Modal.getOrCreateInstance($('contextLimitModal')).show();
  });
}

async function applyContextStrategy(strategy, sysPrompt) {
  if (strategy === 'sliding') {
    const keep = Math.max(2, Math.ceil(messages.length / 2));
    messages = messages.slice(messages.length - keep);
    resetSession();
  } else if (strategy === 'summarize') {
    const keep = Math.max(2, Math.ceil(messages.length / 2));
    const toSummarize = messages.slice(0, messages.length - keep);
    const recent = messages.slice(messages.length - keep);
    if (toSummarize.length > 0) {
      setStatus('Summarizing conversation history…');
      const rawText = toSummarize
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');
      const summaryMsgs = [{ role: 'user', content: `Summarize this conversation in 3-5 concise sentences:\n\n${rawText}` }];
      let summary = '';
      try {
        for await (const chunk of streamAI(summaryMsgs, sysPrompt)) summary += chunk;
      } catch (e) {
        console.warn('Context summarization failed, falling back to sliding window:', e);
        messages = messages.slice(messages.length - keep);
        resetSession();
        return;
      }
      messages = [
        { role: 'user', content: `[Summary of earlier conversation: ${summary.trim()}]` },
        { role: 'assistant', content: 'Understood.' },
        ...recent,
      ];
    }
    resetSession();
  }
  // 'yolo': do nothing
}

export function appendBubble(role, text) {
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

export async function send() {
  const input = $('user-input');
  const text  = input.value.trim();
  if (!text || generating) return;

  const sendT0 = performance.now();
  currentPerf = newPerfRecord();

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

  const MAX_TAG_OVERHEAD = SKILLS.reduce((m, s) => Math.max(m, s.tag.length + 2), 32);
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
      let openerAt = Infinity;
      for (const skill of SKILLS) {
        const idx = pending.indexOf('<' + skill.tag + '>');
        if (idx !== -1 && idx < openerAt) openerAt = idx;
      }
      if (openerAt < Infinity) {
        safe = pending.slice(0, openerAt); pending = pending.slice(openerAt);
      } else if (pending.length - lastLt > MAX_TAG_OVERHEAD) {
        safe = pending; pending = '';
      } else {
        safe = pending.slice(0, lastLt); pending = pending.slice(lastLt);
      }
    }
    if (safe) bubble.insertBefore(document.createTextNode(safe), cursor);
    scheduleScroll();
  }

  async function streamPass(streamMessages, sysPrompt, isFirstPass) {
    const t0 = performance.now();
    let lastChunkTs = null;
    const chunkDeltas = [];
    for await (const chunk of streamAI(streamMessages, sysPrompt)) {
      const now = performance.now();
      if (currentPerf && chunk && isFirstPass) {
        if (currentPerf.ttft === null) {
          currentPerf.ttft = now - sendT0;
          lastChunkTs = now;
        } else if (lastChunkTs !== null) {
          chunkDeltas.push(now - lastChunkTs);
          lastChunkTs = now;
        }
      }
      fullText += chunk;
      emitChunk(chunk);
    }
    if (currentPerf) {
      currentPerf.genMs += performance.now() - t0;
      if (isFirstPass && chunkDeltas.length && currentPerf.itl === null) {
        currentPerf.itl = chunkDeltas.reduce((a, b) => a + b) / chunkDeltas.length;
      }
    }
  }

  let pending  = '';
  let fullText = '';
  try {
    setStatus('Planning skills…');
    const turnPlan = await planSkillsForTurn(text);
    let activeTags = new Set(turnPlan.selectedTags);
    let activeSkills = turnPlan.activeSkills;
    let sysPrompt = await buildSystemPrompt(activeSkills, turnPlan.enabledSkills);

    if (currentPerf) {
      const soulText = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
      const [sysTokens, soulTokens, userTokens] = await Promise.all([
        estimateTokens(sysPrompt),
        estimateTokens(soulText),
        estimateTokens(text),
      ]);
      currentPerf.backend = backend;
      currentPerf.tokensInSystem = soulTokens;
      currentPerf.tokensInSkills = Math.max(0, sysTokens - soulTokens);
      currentPerf.tokensInUser = userTokens;
    }

    if (contextMax > 0) {
      const allText = [sysPrompt, ...messages.map(m => m.content)].join(' ');
      const estimatedTokens = await estimateTokens(allText);
      if (estimatedTokens / contextMax >= CONTEXT_WARN_RATIO) {
        const strategy = await promptContextStrategy(estimatedTokens / contextMax);
        if (strategy !== 'yolo') {
          await applyContextStrategy(strategy, sysPrompt);
          setStatus('Planning skills…');
        }
      }
    }

    resetSession();

    // Pass 1
    await streamPass(messages, sysPrompt, true);

    const emittedTags = findInvokedSkillTags(fullText);
    const missingEnabledTags = emittedTags.filter(tag => turnPlan.enabledSkills.has(tag) && !activeTags.has(tag));
    if (missingEnabledTags.length) {
      setStatus(`Loading inferred skills: ${missingEnabledTags.join(', ')}…`);
      const { loadedAny, loadedTags } = await loadSkillsByTag(missingEnabledTags);
      if (loadedAny) {
        loadedTags.forEach(tag => activeTags.add(tag));
        activeSkills = getLoadedSkillsByTag([...activeTags]);
        sysPrompt = await buildSystemPrompt(activeSkills, turnPlan.enabledSkills);
        resetSession();
        while (bubble.firstChild) bubble.removeChild(bubble.firstChild);
        bubble.appendChild(cursor);
        pending = '';
        fullText = '';
        if (currentPerf) currentPerf.ttft = null;
        await streamPass(messages, sysPrompt, true);
      }
    }

    const toolResults  = [];
    const invokedTools = new Set();
    for (const skill of activeSkills) {
      if (!skill.call) continue;
      const re = new RegExp(`<${skill.tag}>([\\s\\S]*?)<\\/${skill.tag}>`, 'g');
      let m;
      while ((m = re.exec(fullText)) !== null) {
        toolResults.push(`${skill.tag}: ${await skill.call(m[1].trim())}`);
        invokedTools.add(manifest.find(e => e.tag === skill.tag)?.label ?? skill.tag);
      }
    }

    if (toolResults.length) {
      while (bubble.firstChild) bubble.removeChild(bubble.firstChild);
      bubble.appendChild(cursor);
      pending = '';
      setStatus('Running tools…');
      const pass1Clean = stripSkillTags(fullText).trim();
      const augmented  = [
        ...messages,
        ...(pass1Clean ? [{ role: 'assistant', content: pass1Clean }] : []),
        { role: 'user', content: `Tool results:\n${toolResults.join('\n')}\n\nNow answer using this data.` },
      ];
      fullText = '';
      resetSession();
      if (currentPerf) currentPerf.passes = 2;
      await streamPass(augmented, sysPrompt, false);
      resetSession();
    }

    const needsReset = await dispatchSkillCalls(fullText, activeSkills);
    if (needsReset) resetSession();

    const cleanText = stripSkillTags(fullText, activeSkills);
    if (currentPerf) {
      const [fullTokOut, cleanTokOut] = await Promise.all([
        estimateTokens(fullText),
        estimateTokens(cleanText),
      ]);
      currentPerf.tokensOutSkillCalls = Math.max(0, fullTokOut - cleanTokOut);
      currentPerf.tokensOutUser = cleanTokOut;
      perfHistory.push({ ...currentPerf });
      currentPerf = null;
    }
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
    currentPerf = null;
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
export function stripSkillTags(text, activeSkills = SKILLS) {
  const replaceByTag = new Map(activeSkills.map(skill => [skill.tag?.toLowerCase(), skill.replace ?? (() => '')]));
  let out = text.replace(/<([a-z0-9-]+)>([\s\S]*?)<\/\1>/gi, (full, rawTag, content) => {
    const tag = rawTag.toLowerCase();
    if (!knownSkillTags.has(tag)) return full;
    return (replaceByTag.get(tag) ?? (() => ''))(content.trim());
  });

  const dangling = out.match(/<([a-z0-9-]+)>[\s\S]*$/i);
  if (dangling?.index !== undefined) {
    const tag = dangling[1].toLowerCase();
    if (knownSkillTags.has(tag)) out = out.slice(0, dangling.index);
  }
  return out;
}

// Returns true if any skill handler signalled a session reset is needed.
export async function dispatchSkillCalls(text, activeSkills = SKILLS) {
  let needsReset = false;
  for (const skill of activeSkills) {
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
export async function renderHistory() {
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

export async function loadChat(chat) {
  chatId   = chat.id;
  messages = chat.messages ?? [];
  resetSession();
  $('chat-title').textContent = chat.title;
  $('chat-messages').innerHTML = '';
  messages.forEach(m => appendBubble(m.role, m.content));
  await renderHistory();
}

export function newChat() {
  chatId   = null;
  messages = [];
  resetSession();
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
