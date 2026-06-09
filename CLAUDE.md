# WebBrain — Developer Guide

No build step. All JS is native ESM loaded via `<script type="module" src="js/script.js">`.
IndexedDB via `tools/db.js`. No bundler, no transpiler, no package.json.

## Module map

| File | Owns |
|---|---|
| `js/utils.js` | `$`, `esc`, `setStatus`, `setSend`, `autoResize`, `estimateTokens`, `DEFAULT_SOUL` |
| `js/tools.js` | Tool registry, router, loader, system-prompt builder |
| `js/ai.js` | Chrome AI + Litert-LM backends, OPFS model cache, `streamAI` generator |
| `js/chat.js` | Chat state (`messages`, `chatId`), `send()`, history UI, `stripToolTags`, `dispatchToolCalls` |
| `js/settings-ui.js` | Settings modal panels: memory, tools, todos, benchmark |
| `js/script.js` | Theme init, event listeners, boot sequence |
| `tools/db.js` | All IndexedDB access (chats, facts, todos, settings) |
| `tools/manifest.json` | Tool metadata registry |
| `tools/<tag>/tool.js` | Individual tool implementations |

Import graph (no cycles): `utils` ← `tools`/`ai` ← `chat` ← `settings-ui` ← `script`

## Tool object interface

Each `tools/<tag>/tool.js` exports a default object:

```js
{
  tag: 'my-tool',          // required — must match directory name, lowercase
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

Manifest fields (in `tools/manifest.json`): `tag`, `label`, `description`, `category`,
`default` (boolean — load on first run), `risk` (`passive` | `side_effect` | `permission_required`),
`triggers` (string[] — phrase patterns for auto-selection).

## Key patterns and invariants

**Session management** — `session` is encapsulated in `ai.js`. Never assign it directly elsewhere.
- `resetSession()` — soft reset; forces Chrome AI to build a new session on the next turn.
  Use whenever the system prompt changes mid-conversation (tools toggled, facts updated, soul edited).
- `destroySession()` — hard reset; calls `session.destroy()` first. Use only in the benchmark
  runner where we need immediate resource release between isolated inference runs.

**Two-pass inference** — `send()` in `chat.js` runs up to two passes:
1. Pass 1: stream the model's response, collect `<tag>` invocations
2. If any tool had `call()` invoked, inject tool results and re-stream (pass 2).
   Tools with only `handle()` (side-effect tools like `fact`, `todo`) run after pass 2.

**Tool routing** — `planToolsForTurn()` scores every enabled tool against the user's message
before each turn and loads the top matches. Tools not loaded are still listed in the system
prompt directory (as `disabled`). If the model invokes a tag that wasn't preloaded but is enabled,
`send()` loads it and retries pass 1 once.

**Live bindings** — Module-level `let` exports (`SKILLS`, `backend`, `messages`, `generating`,
`perfHistory`) are ES module live bindings: importers always see the current value but cannot
write to them. Mutation must go through exported functions (`resetSession()`, `clearPerfHistory()`,
`unloadTool()`, etc.).

**Token estimation** — `estimateTokens()` in `utils.js` lazy-loads `tokenx` from CDN and falls
back to a word-count heuristic. Used for perf metrics only, never for hard limits.
