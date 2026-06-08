# WebBrain — Developer Guide

No build step. All JS is native ESM loaded via `<script type="module" src="js/script.js">`.
IndexedDB via `skills/db.js`. No bundler, no transpiler, no package.json.

## Module map

| File | Owns |
|---|---|
| `js/utils.js` | `$`, `esc`, `setStatus`, `setSend`, `autoResize`, `estimateTokens`, `DEFAULT_SOUL` |
| `js/skills.js` | Skill registry, router, loader, system-prompt builder |
| `js/ai.js` | Chrome AI + Litert-LM backends, OPFS model cache, `streamAI` generator |
| `js/chat.js` | Chat state (`messages`, `chatId`), `send()`, history UI, `stripSkillTags`, `dispatchSkillCalls` |
| `js/settings-ui.js` | Settings modal panels: memory, skills, todos, benchmark |
| `js/script.js` | Theme init, event listeners, boot sequence |
| `skills/db.js` | All IndexedDB access (chats, facts, todos, settings) |
| `skills/manifest.json` | Skill metadata registry |
| `skills/<tag>/skill.js` | Individual skill implementations |

Import graph (no cycles): `utils` ← `skills`/`ai` ← `chat` ← `settings-ui` ← `script`

## Skill object interface

Each `skills/<tag>/skill.js` exports a default object:

```js
{
  tag: 'my-skill',          // required — must match directory name, lowercase
  instruction: '...',       // optional — injected into system prompt when loaded
  fetch() {},               // optional — called each turn; return string appended to system prompt
  async call(content) {},   // optional — data fetch; model emits <tag>payload</tag>,
                            //   result is injected as a tool result in pass 2
  async handle(content) {}, // optional — side effects after generation;
                            //   return true to signal session reset needed
  replace(content) {},      // optional — transforms tag content for bubble display
                            //   (default: suppress entirely → return '')
}
```

Manifest fields (in `skills/manifest.json`): `tag`, `label`, `description`, `category`,
`default` (boolean — load on first run), `risk` (`passive` | `side_effect` | `permission_required`),
`triggers` (string[] — phrase patterns for auto-selection).

## Key patterns and invariants

**Session management** — `session` is encapsulated in `ai.js`. Never assign it directly elsewhere.
- `resetSession()` — soft reset; forces Chrome AI to build a new session on the next turn.
  Use whenever the system prompt changes mid-conversation (skills toggled, facts updated, soul edited).
- `destroySession()` — hard reset; calls `session.destroy()` first. Use only in the benchmark
  runner where we need immediate resource release between isolated inference runs.

**Two-pass inference** — `send()` in `chat.js` runs up to two passes:
1. Pass 1: stream the model's response, collect `<tag>` invocations
2. If any skill had `call()` invoked, inject tool results and re-stream (pass 2).
   Skills with only `handle()` (side-effect skills like `fact`, `todo`) run after pass 2.

**Skill routing** — `planSkillsForTurn()` scores every enabled skill against the user's message
before each turn and loads the top matches. Skills not loaded are still listed in the system
prompt directory (as `disabled`). If the model invokes a tag that wasn't preloaded but is enabled,
`send()` loads it and retries pass 1 once.

**Live bindings** — Module-level `let` exports (`SKILLS`, `backend`, `messages`, `generating`,
`perfHistory`) are ES module live bindings: importers always see the current value but cannot
write to them. Mutation must go through exported functions (`resetSession()`, `clearPerfHistory()`,
`unloadSkill()`, etc.).

**Token estimation** — `estimateTokens()` in `utils.js` lazy-loads `tokenx` from CDN and falls
back to a word-count heuristic. Used for perf metrics only, never for hard limits.
