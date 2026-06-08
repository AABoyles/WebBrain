# ROADMAP

## Multimodal

Gemma 4 is multimodal. Let's add the ability to "upload" files of the compatible filetypes and feed them into the model.

## More Models

Gemma 4 E4B is the obvious choice, but there are many models at this scale that could work:
* [Gemma 4 12B](https://huggingface.co/litert-community/gemma-4-12B-it-litert-lm)
* litert-community/SmolLM2-135M-Instruct

## Per-message Model Swapping

Instead of a single global model, enable swapping per-message. Add a widget to re-run a prompt.

## RAG

"Upload" documents, compute embeddings, store them in IndexedDB, query them when needed. Something like this: https://machinelearningmastery.com/building-semantic-search-with-transformers-js-and-sentence-embeddings/

## RAG++

RAG, but with corpora of documents instead of a single document. Organize them into Claude-like "Projects".

## Nerd Mode

Expose metrics in the UI, like Model, Run mode (WASM/WebGPU), Tokens in, Tokens out, TTFT, ITL.

Expose controls in the UI to tune your model, like TopK, Temperature, Max Tokens, etc.

Add lightweight telemetry counters (selected skills, fallback reruns, added prompt tokens) to tune routing quality.