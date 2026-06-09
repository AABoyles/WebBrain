import {
  txGet,
  getFacts,
} from '../skills/db.js';
import { DEFAULT_SOUL } from './utils.js';

/**
 * @typedef {Object} Skill
 * @property {string}   tag          - Identifier; matches directory name and the native tool call name.
 * @property {string}   [instruction] - Text injected into the system prompt when this skill is active.
 * @property {function(): (string|Promise<string>)} [fetch] - Called each turn; return value appended to system prompt as live context.
 * @property {function(string): Promise<string>} [call]   - Data-fetch hook; model emits tool call, return value feeds pass 2.
 * @property {function(string): Promise<boolean|void>} [handle] - Side-effect hook; runs after generation. Return true to trigger resetSession().
 */

// Exports: SKILLS, manifest, knownSkillTags, loadSkill, unloadSkill, initSkills,
//          invalidateStaticSysPrompt, planSkillsForTurn, loadSkillsByTag,
//          getLoadedSkillsByTag, findInvokedSkillTags, extractToolCalls,
//          buildToolResponse, buildSystemPrompt

// ── Skills registry ───────────────────────────────────────────────────────────
/** @type {Skill[]} */
export let SKILLS   = [];
export let manifest = [];
let manifestByTag   = new Map();
export let knownSkillTags = new Set();

function rebuildSkillIndexes() {
  manifestByTag  = new Map();
  knownSkillTags = new Set();
  for (const entry of manifest) {
    if (!entry?.tag) continue;
    const tag = entry.tag.toLowerCase();
    knownSkillTags.add(tag);
    manifestByTag.set(tag, { ...entry, tag });
  }
}

// ── Native Gemma 4 tool format ────────────────────────────────────────────────

function buildToolDeclaration(entry, skill) {
  const desc = (entry?.description ?? skill.tag).replace(/"/g, "'");
  return `<|tool>declaration:${skill.tag}{description:<|"|>${desc}<|"|>,parameters:{properties:{input:{description:<|"|>payload<|"|>,type:<|"|>string<|"|>}},required:[<|"|>input<|"|>],type:<|"|>object<|"|>}}<tool|>`;
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

// ── Skill directory (system prompt section) ───────────────────────────────────

function buildSkillDirectoryPrompt(activeSkills) {
  if (!manifest.length) return '';

  const activeTags = new Set(activeSkills.map(s => s.tag));

  // Full <|tool> declarations for loaded callable skills.
  const declarations = activeSkills
    .filter(s => s.call || s.handle)
    .map(s => buildToolDeclaration(manifestByTag.get(s.tag), s))
    .join('\n');

  // Compact list for unloaded skills.
  const otherTags = manifest.filter(e => !activeTags.has(e.tag)).map(e => e.tag);
  const callFormat = `<|tool_call>call:SKILL{input:<|"|>VALUE<|"|>}<tool_call|>`;
  let out = declarations;
  if (otherTags.length) {
    out += (out ? '\n' : '') + `Other available tools (call as ${callFormat}): ${otherTags.join(', ')}`;
  }
  return out;
}

// ── Skill loading ─────────────────────────────────────────────────────────────

export async function loadSkillsByTag(tags) {
  const uniqTags = [...new Set(tags.map(t => t.toLowerCase()))];
  const results  = await Promise.all(uniqTags.map(loadSkill));
  return {
    loadedAny:  results.some(Boolean),
    loadedTags: uniqTags,
  };
}

export function getLoadedSkillsByTag(tags) {
  const wanted = new Set(tags.map(t => t.toLowerCase()));
  return SKILLS.filter(skill => wanted.has(skill.tag?.toLowerCase()));
}

// Returns always-on skills plus any skills whose trigger phrases appear in the
// user's message. All other skill tags remain available for on-demand invocation.
export async function planSkillsForTurn(userText = '') {
  const lowerText = ' ' + userText.toLowerCase() + ' ';
  const tags = manifest
    .filter(e => e.default || (e.triggers ?? []).some(t => lowerText.includes(t.toLowerCase())))
    .map(e => e.tag);
  const uniqTags = [...new Set(tags)];
  await loadSkillsByTag(uniqTags);
  return {
    defaultTags: uniqTags,
    activeSkills: getLoadedSkillsByTag(uniqTags),
  };
}

// Returns known skill tags invoked in text via native Gemma 4 tool call format.
export function findInvokedSkillTags(text) {
  return [...new Set(
    extractToolCalls(text).map(c => c.name).filter(n => knownSkillTags.has(n))
  )];
}

export async function loadSkill(tag) {
  const normalizedTag = tag.toLowerCase();
  if (SKILLS.some(s => s.tag === normalizedTag)) return false;
  invalidateStaticSysPrompt();
  try {
    const { default: skill } = await import(`../skills/${normalizedTag}/skill.js`);
    SKILLS.push(skill);
    return true;
  } catch (e) {
    console.error(`Failed to load skill "${normalizedTag}":`, e);
    return false;
  }
}

export function unloadSkill(tag) {
  SKILLS = SKILLS.filter(s => s.tag !== tag);
  invalidateStaticSysPrompt();
}

export async function initSkills() {
  manifest = await fetch('../skills/manifest.json').then(r => r.json());
  manifest = manifest.map(entry => ({ ...entry, tag: entry.tag?.toLowerCase?.() ?? entry.tag }));
  rebuildSkillIndexes();
  const defaultTags = manifest.filter(e => e.default).map(e => e.tag);
  await Promise.all(defaultTags.map(loadSkill));
}

// ── System prompt ─────────────────────────────────────────────────────────────
let _staticSysPrompt = null;
export function invalidateStaticSysPrompt() { _staticSysPrompt = null; }

export async function buildSystemPrompt(activeSkills = SKILLS) {
  const soul           = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
  const skillDirectory = buildSkillDirectoryPrompt(activeSkills);
  const skillBlock     = activeSkills.filter(s => s.instruction).map(s => s.instruction).join('\n\n');
  const liveLines      = (await Promise.all(SKILLS.filter(s => s.fetch).map(s => s.fetch()))).filter(Boolean);
  const facts          = await getFacts();
  let prompt = soul;
  if (skillDirectory)   prompt += '\n\n' + skillDirectory;
  if (skillBlock)       prompt += '\n\n## Active Skill Instructions\n' + skillBlock;
  if (liveLines.length) prompt += '\n\n## Live context:\n' + liveLines.join('\n');
  if (facts.length)     prompt += '\n\n## Facts I recorded:\n' + facts.map(f => `- ${f.text}`).join('\n');
  return prompt;
}
