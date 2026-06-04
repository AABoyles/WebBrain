export default {
  tag: 'dadjoke',
  instruction: `DAD JOKE SKILL: To get a random dad joke, emit <dadjoke></dadjoke> (empty tag). They're bad. That's the point.

Example: "Tell me a dad joke" → <dadjoke></dadjoke>`,
  async call() {
    try {
      const res = await fetch('https://icanhazdadjoke.com/', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return 'Dad joke server unavailable. I guess that\'s the real joke.';
      const { joke } = await res.json();
      return joke;
    } catch (e) {
      return `Why couldn't the dad joke load? Because it was too cheesy for the network. (Error: ${e.message})`;
    }
  },
  async handle() {},
};
