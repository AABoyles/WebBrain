import {
  txGet, txPut,
  getFacts,
} from '../skills/db.js';
import { DEFAULT_SOUL } from './utils.js';

/**
 * @typedef {Object} Skill
 * @property {string}   tag          - Identifier; matches directory name and XML tag the model emits.
 * @property {string}   [instruction] - Text injected into the system prompt when this skill is loaded.
 * @property {function(): (string|Promise<string>)} [fetch] - Called each turn; return value appended to system prompt as live context.
 * @property {function(string): Promise<string>} [call]   - Data-fetch hook; model emits <tag>payload</tag>, return value feeds pass 2.
 * @property {function(string): Promise<boolean|void>} [handle] - Side-effect hook; runs after generation. Return true to trigger resetSession().
 * @property {function(string): string} [replace] - Transforms tag content for bubble display (default: suppress → '').
 */

// Exports: SKILLS, manifest, knownSkillTags, getEnabledSkills, setEnabledSkills,
//          loadSkill, unloadSkill, initSkills, invalidateStaticSysPrompt,
//          planSkillsForTurn, loadSkillsByTag, getLoadedSkillsByTag,
//          findInvokedSkillTags, buildSystemPrompt

// ── Skills registry ───────────────────────────────────────────────────────────
/** @type {Skill[]} */
export let SKILLS   = [];
export let manifest = [];
let manifestByTag = new Map();
let skillKeywordIndex = new Map();
let skillTriggerIndex = new Map();
export let knownSkillTags = new Set();

const ROUTER_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'you',
  'about', 'using', 'show', 'please', 'need', 'want', 'help', 'make', 'give',
  'what', 'when', 'where', 'which', 'who', 'how', 'just', 'real', 'some',
  'text', 'data', 'code', 'tool', 'skill', 'browser', 'stored', 'list', 'info'
]);
const MAX_AUTO_SKILLS_PER_TURN = 4;

function tokenizeIntent(text) {
  return new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(t => t.length > 2));
}

function buildSkillKeywords(entry) {
  const words = [
    ...(entry.tag?.split('-') ?? []),
    ...((entry.label ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []),
    ...((entry.description ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []),
  ];
  return [...new Set(words.filter(w => w.length > 2 && !ROUTER_STOPWORDS.has(w)))];
}

function compileTriggers(entry) {
  return (entry.triggers ?? []).map(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[\\s,!?])${escaped}(?:[\\s,!?.;]|$)`, 'i');
  });
}

function rebuildSkillIndexes() {
  manifestByTag = new Map();
  skillKeywordIndex = new Map();
  skillTriggerIndex = new Map();
  knownSkillTags = new Set();
  for (const entry of manifest) {
    if (!entry?.tag) continue;
    const tag = entry.tag.toLowerCase();
    knownSkillTags.add(tag);
    manifestByTag.set(tag, { ...entry, tag });
    skillKeywordIndex.set(tag, buildSkillKeywords(entry));
    skillTriggerIndex.set(tag, compileTriggers(entry));
  }
}

function buildSkillDirectoryPrompt(enabledSkills) {
  if (!manifest.length) return '';
  const lines = [
    '## Skill Directory',
    'Use <tag>payload</tag> when a listed skill is needed.',
    'Only invoke skills marked enabled.',
  ];
  for (const entry of manifest) {
    const state = enabledSkills.has(entry.tag) ? 'enabled' : 'disabled';
    lines.push(`- ${entry.tag} (${state}): ${entry.label}`);
  }
  return lines.join('\n');
}

// Minimum score required to auto-select a skill based on its risk level.
const RISK_MIN_SCORE = { passive: 3, side_effect: 10, permission_required: 10 };

const SCORE_EXPLICIT_TAG  = 12;
const SCORE_TRIGGER_MATCH = 10;
const SCORE_LABEL_MATCH   =  5;
const SCORE_TAG_IN_MSG    =  4;
const SCORE_TAG_PHRASE    =  3;
const SCORE_KEYWORD_HIT   =  1;
const MAX_KEYWORD_HITS    =  4;

function rankSkillsForPrompt(userText, enabledSkills) {
  const paddedText = ' ' + userText + ' ';
  const normalized = userText.toLowerCase();
  const tokens = tokenizeIntent(userText);
  const scored = [];

  for (const entry of manifest) {
    const tag = entry.tag?.toLowerCase();
    if (!tag || !enabledSkills.has(tag)) continue;

    let score = 0;

    if (normalized.includes(`<${tag}>`)) score += SCORE_EXPLICIT_TAG;

    let triggerHit = false;
    for (const re of skillTriggerIndex.get(tag) ?? []) {
      if (re.test(paddedText)) { score += SCORE_TRIGGER_MATCH; triggerHit = true; break; }
    }

    if (!triggerHit) {
      const tagPhrase   = tag.replace(/-/g, ' ');
      const labelPhrase = (entry.label ?? '').toLowerCase();
      if (normalized.includes(tag)) score += SCORE_TAG_IN_MSG;
      if (tagPhrase !== tag && normalized.includes(tagPhrase)) score += SCORE_TAG_PHRASE;
      if (labelPhrase && normalized.includes(labelPhrase)) score += SCORE_LABEL_MATCH;

      let kwHits = 0;
      for (const word of skillKeywordIndex.get(tag) ?? []) {
        if (tokens.has(word)) { kwHits++; if (kwHits >= MAX_KEYWORD_HITS) break; }
      }
      score += kwHits * SCORE_KEYWORD_HIT;
    }

    if (score > 0) scored.push({ tag, score, risk: entry.risk ?? 'passive' });
  }

  scored.sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag));

  const selected = [];
  const seen = new Set();

  for (const entry of manifest) {
    const tag = entry.tag?.toLowerCase();
    if (entry.default && tag && enabledSkills.has(tag) && !seen.has(tag)) {
      selected.push(tag);
      seen.add(tag);
    }
  }

  for (const item of scored) {
    if (seen.has(item.tag)) continue;
    const minScore = RISK_MIN_SCORE[item.risk] ?? RISK_MIN_SCORE.passive;
    if (item.score < minScore) continue;
    if (selected.length >= MAX_AUTO_SKILLS_PER_TURN) break;
    selected.push(item.tag);
    seen.add(item.tag);
  }

  return { selectedTags: selected, scored };
}

export async function loadSkillsByTag(tags) {
  const uniqTags = [...new Set(tags.map(t => t.toLowerCase()))];
  const results = await Promise.all(uniqTags.map(loadSkill));
  return {
    loadedAny: results.some(Boolean),
    loadedTags: uniqTags,
  };
}

export function getLoadedSkillsByTag(tags) {
  const wanted = new Set(tags.map(t => t.toLowerCase()));
  return SKILLS.filter(skill => wanted.has(skill.tag?.toLowerCase()));
}

export async function planSkillsForTurn(userText) {
  const enabledSkills = await getEnabledSkills();
  const { selectedTags, scored } = rankSkillsForPrompt(userText, enabledSkills);
  await loadSkillsByTag(selectedTags);
  return {
    enabledSkills,
    selectedTags,
    activeSkills: getLoadedSkillsByTag(selectedTags),
    scored,
  };
}

export function findInvokedSkillTags(text) {
  const tags = new Set();
  const re = /<([a-z0-9-]+)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const tag = m[1].toLowerCase();
    if (knownSkillTags.has(tag)) tags.add(tag);
  }
  return [...tags];
}

export async function getEnabledSkills() {
  const raw = await txGet('settings', 'enabledSkills');
  if (raw !== undefined) return new Set(JSON.parse(raw));
  const defaults = new Set(manifest.filter(e => e.default).map(e => e.tag));
  await setEnabledSkills(defaults);
  return defaults;
}

export async function setEnabledSkills(set) {
  await txPut('settings', JSON.stringify([...set]), 'enabledSkills');
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
  const enabled = await getEnabledSkills();
  await Promise.all([...enabled].map(loadSkill));
}

// ── System prompt ─────────────────────────────────────────────────────────────
let _staticSysPrompt = null;
export function invalidateStaticSysPrompt() { _staticSysPrompt = null; }

export async function buildSystemPrompt(activeSkills = SKILLS, enabledSkills = null) {
  const enabled = enabledSkills ?? await getEnabledSkills();
  const soul      = (await txGet('settings', 'soul')) ?? DEFAULT_SOUL;
  const skillDirectory = buildSkillDirectoryPrompt(enabled);
  const skillBlock = activeSkills.filter(s => s.instruction).map(s => s.instruction).join('\n\n');
  const enabledSkillObjects = SKILLS.filter(s => enabled.has(s.tag));
  const liveLines  = (await Promise.all(enabledSkillObjects.filter(s => s.fetch).map(s => s.fetch()))).filter(Boolean);
  const facts      = await getFacts();
  let prompt = soul;
  if (skillDirectory) prompt += '\n\n' + skillDirectory;
  if (skillBlock)    prompt += '\n\n## Loaded Skill Instructions (Current Turn)\n' + skillBlock;
  if (liveLines.length) prompt += '\n\n## Live context:\n' + liveLines.join('\n');
  if (facts.length)     prompt += '\n\n## Facts I recorded:\n' + facts.map(f => `- ${f.text}`).join('\n');
  return prompt;
}
