# ROADMAP

Items are ordered by urgency. The first three are reliability and trust foundations — ship them before the fancier features below.

---

## Data Export / Backup

All user data (chats, facts, todos, dreams, habits, gratitude) lives exclusively in IndexedDB. Chrome can silently wipe it on low storage; "Clear browsing data" destroys it; private browsing sessions reset it. Users have no recovery path.

Add a full JSON dump (all stores) downloadable from the settings panel, and a corresponding restore/import flow. Export should be a single file with a version field so future schema changes can migrate it. This is the precondition for users trusting the app with anything they care about.


## Voice Input

The `speak` tool handles TTS output. The Web Speech API (`SpeechRecognition`) adds mic input with zero external dependencies and completes the voice loop. A mic button on the input bar, with interim transcript display, is the whole feature.

Edge cases to handle: browser support detection, permission denial gracefully (don't just silently fail), and whether to auto-submit on silence or require an explicit send.

## Multimodal

Gemma 4 is multimodal. Add the ability to attach files of compatible types (images, PDFs) and feed them into the model alongside the text prompt. The upload trigger should be a button in the input bar, with a preview chip showing the attached file. The model receives the file content on the same turn.

File handling should go through the existing two-pass infrastructure — the attachment is part of pass 1 input, not a separate tool call.

## Nerd Mode

Two sub-features that belong together:

**Inference metrics** — Expose model name, run mode (WASM / WebGPU), tokens in, tokens out, TTFT, and ITL in the UI. Probably a collapsible panel per message bubble or a persistent footer bar. These numbers are already computable from the `streamAI` generator.

**Tuning controls** — TopK, Temperature, Max Tokens as adjustable settings. These could live in the main settings modal or as a collapsible panel above the input bar.

**Routing telemetry** — Lightweight counters for selected tools, fallback reruns, and added prompt tokens per turn. This data is the feedback loop for improving `planToolsForTurn()` and catching tools that fire too aggressively or not enough. Log to IndexedDB; expose in the settings panel.

## Per-message Model Swapping

Instead of a single global model, enable choosing the model per-message. A small dropdown or pill on each message bubble would let the user re-run any prompt with a different model for comparison. This pairs naturally with the model list expansion below.

The re-run action should fork the conversation at that point (don't overwrite history) or at minimum show the alternative response inline as a comparison view.

## More Models

The model list should grow beyond the current single option. Candidates at the local-inference scale:

- [Gemma 4 12B](https://huggingface.co/litert-community/gemma-4-12B-it-litert-lm) — higher quality, higher memory requirement
- litert-community/SmolLM2-135M-Instruct — fast, low memory, useful for quick tasks

The OPFS model cache in `ai.js` already handles download-once storage. The main work is model-picker UI, per-model capability flags (e.g., multimodal support), and making sure the benchmark runner in settings can compare across models.

## RAG

"Upload" a document, compute embeddings via Transformers.js sentence embeddings, store vectors in IndexedDB, and query them at inference time to inject relevant chunks into the system prompt.

Reference implementation: [Building Semantic Search with Transformers.js](https://machinelearningmastery.com/building-semantic-search-with-transformers-js-and-sentence-embeddings/)

The embedding model can be cached in OPFS alongside the chat model. The retrieval step fits naturally as a tool `fetch()` call — run the query against stored vectors each turn and append the top-k chunks.

## RAG++ / Projects

RAG, but organized. Multiple document corpora managed as named Projects (analogous to Claude's Projects feature). Each project has its own vector store in IndexedDB, and the user can switch the active project per conversation.

This builds directly on the single-document RAG foundation above. The main additions are project management UI (create, rename, delete, view documents) and a per-chat project selector.
