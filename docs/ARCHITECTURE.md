# WebBrain Architecture

## Frontend

A simple, clean, responsive UI built with Bootstrap. Everything you expect from a Chat interface: a hideable left-menu with the history of your chats. A central panel with a chat interface for talking with the AI. A settings modal gives you the option to switch between models, view the data the model has stored about you, and edit (or yeet!) that data by individual fact or in bulk.

## "Backend"

### If you have Chrome

Google Chrome ships with a simple small language model called "Gemini nano" (but it's basically just Gemma 4 E2B). This chat UI leverages this model. If your browser isn't configured to use Gemini nano, it load Gemma 4 E2B into your system VRAM with WebGPU via litert-lm.

### Tools

We have a bunch. But don't all those tools take up a bunch of context? Well, they normally would, but there's a cool trick we do. We de-couple tool descriptors from tool implementations. The descriptors go into context, and the implementations get called when needed. Knowing you know how to do something is a lot cheaper than knowing how to do it!

### Memory

One specific tool to call out: Here's the good part: as it learns about you, it stores that knowledge in IndexedDB. Right there in your browser.

### SOUL

Want to control how the browser thinks? You can edit its SOUL directly! Just don't cram too much in, the context window is pretty small.
