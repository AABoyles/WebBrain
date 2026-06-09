import {
  txGet,
  getFacts,
} from '../tools/db.js';
import { DEFAULT_SOUL } from './utils.js';

/**
 * @typedef {Object} Tool
 * @property {string}   tag          - Identifier; matches directory name and the native tool call name.
 * @property {string}   [instruction] - Text injected into the system prompt when this tool is active.
 * @property {function(): (string|Promise<string>)} [fetch] - Called each turn; return value appended to system prompt as live context.
 * @property {function(string): Promise<string>} [call]   - Data-fetch hook; model emits tool call, return value feeds pass 2.
 * @property {function(string): Promise<boolean|void>} [handle] - Side-effect hook; runs after generation. Return true to trigger resetSession().
 */

// Exports: SKILLS, manifest, knownToolTags, loadTool, unloadTool, initTools,
//          invalidateStaticSysPrompt, planToolsForTurn, loadToolsByTag,
//          getLoadedToolsByTag, findInvokedToolTags, extractToolCalls,
//          buildToolResponse, buildSystemPrompt

// ── Tools registry ───────────────────────────────────────────────────────────
/** @type {Tool[]} */
export let SKILLS   = [];
export let manifest = [];
let manifestByTag   = new Map();
export let knownToolTags = new Set();

function rebuildToolIndexes() {
  manifestByTag  = new Map();
  knownToolTags = new Set();
  for (const entry of manifest) {
    if (!entry?.tag) continue;
    const tag = entry.tag.toLowerCase();
    knownToolTags.add(tag);
    manifestByTag.set(tag, { ...entry, tag });
  }
}

// ── Native Gemma 4 tool format ────────────────────────────────────────────────

function buildToolDeclaration(entry, tool) {
  const desc = (entry?.description ?? tool.tag).replace(/"/g, "'");
  return `<|tool>declaration:${tool.tag}{description:<|"|>${desc}<|"|>,parameters:{properties:{input:{description:<|"|>payload<|"|>,type:<|"|>string<|"|>}},required:[<|"|>input<|"|>],type:<|"|>object<|"|>}}<tool|>`;
}

// Parse all <|tool_call>call:name{input:<|"|>...<|"|>}<tool_call|> from model output.
export function extractToolCalls(text) {
  const re = /<\|tool_call>call:([\w-]+)\{input:<\|"\|>([\s\S]*?)<\|"\|>\}<tool_call\|>/g;
  const calls = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    calls.push({ name: m[1].toLowerCase(), input: m[2] });
  }
  return calls;
}

// Build a <|tool_response> string to inject after executing a tool call.
export function buildToolResponse(name, result) {
  const safe = String(result).replace(/<\|"\|>/g, "'");
  return `<|tool_response>response:${name}{result:<|"|>${safe}<|"|>}<tool_response|>`;
}

// ── Tool directory (system prompt section) ───────────────────────────────────

function buildToolDirectoryPrompt(activeTools) {
  if (!manifest.length) return '';

  const activeTags = new Set(activeTools.map(s => s.tag));

  // Full <|tool> declarations for loaded callable tools.
  const declarations = activeTools
    .filter(s => s.call || s.handle)
    .map(s => buildToolDeclaration(manifestByTag.get(s.tag), s))
    .join('\n');

  // Compact list for unloaded tools.
  const otherTags = manifest.filter(e => !activeTags.has(e.tag)).map(e => e.tag);
  const callFormat = `<|tool_call>call:SKILL{input:<|"|>VALUE<|"|>}<tool_call|>`;
  let out = declarations;
  if (otherTags.length) {
    out += (out ? '\n' : '') + `Other available tools (call as ${callFormat}): ${otherTags.join(', ')}`;
  }
  return out;
}

// ── Tool loading ─────────────────────────────────────────────────────────────

export async function loadToolsByTag(tags) {
  const uniqTags = [...new Set(tags.map(t => t.toLowerCase()))];
  const results  = await Promise.all(uniqTags.map(loadTool));
  return {
    loadedAny:  results.some(Boolean),
    loadedTags: uniqTags,
  };
}

export function getLoadedToolsByTag(tags) {
  const wanted = new Set(tags.map(t => t.toLowerCase()));
  return SKILLS.filter(tool => wanted.has(tool.tag?.toLowerCase()));
}

// Returns always-on tools plus any tools whose trigger phrases appear in the
// user's message. All other tool tags remain available for on-demand invocation.
export async function planToolsForTurn(userText = '') {
  const lowerText = ' ' + userText.toLowerCase() + ' ';
  const tags = manifest
    .filter(e => e.default || (e.triggers ?? []).some(t => lowerText.includes(t.toLowerCase())))
    .map(e => e.tag);
  const uniqTags = [...new Set(tags)];
  await loadToolsByTag(uniqTags);
  return {
    defaultTags: uniqTags,
    activeTools: getLoadedToolsByTag(uniqTags),
  };
}

// Returns known tool tags invoked in text via native Gemma 4 tool call format.
export function findInvokedToolTags(text) {
  return [...new Set(
    extractToolCalls(text).map(c => c.name).filter(n => knownToolTags.has(n))
  )];
}

export async function loadTool(tag) {
  const normalizedTag = tag.toLowerCase();
  if (SKILLS.some(s => s.tag === normalizedTag)) return false;
  invalidateStaticSysPrompt();
  try {
    const { default: tool } = await import(`../tools/${normalizedTag}/tool.js`);
    SKILLS.push(tool);
    return true;
  } catch (e) {
    console.error(`Failed to load tool "${normalizedTag}":`, e);
    return false;
  }
}

export function unloadTool(tag) {
  SKILLS = SKILLS.filter(s => s.tag !== tag);
  invalidateStaticSysPrompt();
}

export async function initTools() {
  manifest = await fetch('../tools/manifest.json').then(r => r.json());
  manifest = manifest.map(entry => ({ ...entry, tag: entry.tag?.toLowerCase?.() ?? entry.tag }));
  rebuildToolIndexes();
  const defaultTags = manifest.filter(e => e.default).map(e => e.tag);
  await Promise.all(defaultTags.map(loadTool));
}

// ── System prompt ─────────────────────────────────────────────────────────────
let _staticSysPrompt = null;
export function invalidateStaticSysPrompt() { _staticSysPrompt = null; }

export async function buildSystemPrompt(activeTools = SKILLS) {
  const soul           = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
  const toolDirectory = buildToolDirectoryPrompt(activeTools);
  const toolBlock     = activeTools.filter(s => s.instruction).map(s => s.instruction).join('\n\n');
  const liveLines      = (await Promise.all(SKILLS.filter(s => s.fetch).map(s => s.fetch()))).filter(Boolean);
  const facts          = await getFacts();
  let prompt = soul;
  if (toolDirectory)   prompt += '\n\n' + toolDirectory;
  if (toolBlock)       prompt += '\n\n## Active Tool Instructions\n' + toolBlock;
  if (liveLines.length) prompt += '\n\n## Live context:\n' + liveLines.join('\n');
  if (facts.length)     prompt += '\n\n## Facts I recorded:\n' + facts.map(f => `- ${f.text}`).join('\n');
  return prompt;
}
