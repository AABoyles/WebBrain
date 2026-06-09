# WebBrain

Private AI with Persistent Memory. In your *Browser*.

## Questions you might have

**Is it private?**

Completely. The AI runs entirely in your web browser. Don't take my word for it: Once you have a model cached, try disconnecting your computer from the internet. It still works. Your data never gets sent off your machine.

**How does it work?**

WebBrain loads all the model weights into your browser's cache. Check out [ARCHITECTURE.md](docs/ARCHITECTURE.md) for more details.

**Why does it take so long to start?**

Before it runs, it needs to download an entire model. We're using Gemma 4 E2B and Gemma 4 E4B, which are tiny by LLM standards, but big by files-you-download-from-the-internet standards. E2B is around 2GB, and E4B is about 3GB. We have to download the entire thing before we can use them, so it takes a few minutes. But the good news it only has to do that the first time you load a model. Subsequent loads should pull them from your device cache.

Once the model is downloaded, it needs to be loaded in your device's VRAM. This takes a few seconds.

**Why is it slow?**

It's a whole AI running in your browser. This means we have a lot of bottlenecks: downloading the model (see above), initializing the model in your VRAM (ditto), interacting through WebGPU, and swapping memory if you don't have enough VRAM to hold an entire model plus KV Cache plus your context window.

**Why is it doing [some stupid thing]?**

As of this writing (June 2026), [Gemma 4 is among the best-in-class](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/) Mid-size Language Models, but if you're used to working with frontier models with 1T+ parameters (e.g. Claude, ChatGPT), it's going to be much less capable.

**What are all those tools for?**

LLMs are great a predicting what an answer to a question should look like, but only sometimes OK at actually knowing the answer. There are a few good reasons for this:
* Models were trained on data up to a cutoff date, and by default don't have any information about the world after that date.
* Models may have been trained on data that answers a question, but that doesn't mean they can recall it amidst the ocean of other information that churned through them in training.
* Models often perform poorly on tasks like complicated out-of-training arithmetic or generating random values.
* Models are fundamentally stateless: open a new chat session and you have a blank slate. The model recalls nothing about you or your prior interactions with it.

Tools are one way of addressing these deficiencies. Some tools (e.g. [date](), [location]()) give the model context about its current circumstances. Some tools (e.g. [wiki]()) provide the model with the ability to access external information. And most of our tools provide bite-sized chunks of code that the model can run to do things like generate statistically-validated pseudo-random, instead of trying to guess what a good "random" number should be.

**Don't those tool instructions clutter up your context window?**

No, they don't! Fundamental insight here: knowing you know how to do something takes up a lot less context than actually knowing how to do it. The system prompt includes a very brief description of each tool, so it knows how to call each one and why it might want to do so. If it does, then the model gets another prompt (this one internally, without additional user input) which includes the full instructions for using the tool. The model calls the tool, gets the result as another prompt, and finally constructs an intelligent response to the user's prompt with the information from the tool call. It's a bit of back-and-forth, but it keeps the context window super clean for longer conversations.

**How does it remember stuff about me?**

That would be the Memory tool. It's really simple: if you say something about yourself, it sends a copy of that information to the memory tool. The Memory tool picks it up and stores it in a little database in your web browser. This database is preserved even if you reload the page. Those memories get added to the system prompt, so as you use it, it remembers more about you.

**It doesn't work! What gives?**

If you can't load a model at all, some questions:

* How powerful is your computer? If you don't have enough VRAM to load a model all at once, your computer should be able to swap between VRAM and RAM. If you don't have enough RAM to load the model, you might be swapping from your hard drive which will be VERY slow (if it works at all).
* What browser are you using and is it up-to-date? I tested using Google Chrome 148.0.7778.217. Support for the WebGPU API is [far from universally available](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility).

**Did you consider using the Prompt API?**

Yes! This was originally intended as a demonstration of [Prompt API's capabilities](https://developer.chrome.com/docs/ai/prompt-api), with [Gemma 4 through litert-lm](https://developers.google.com/edge/litert-lm/js) as a fallback. The Prompt API was nice because it was faster by default (no download, well-tuned to the client machine), but much less flexible (low capped context window, weights not swappable).
