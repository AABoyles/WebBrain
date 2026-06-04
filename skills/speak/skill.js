export default {
  tag: 'speak',
  instruction: `TEXT-TO-SPEECH SKILL: When asked to read something aloud, narrate, or speak text, emit <speak>text to say</speak>. The browser will read it using the Web Speech API. Do not emit this tag unless the user explicitly asks for audio output.

Examples:
- "Say hello out loud" → Hello! <speak>Hello! I'm WebBrain.</speak>
- "Read that answer to me" → <speak>The result is forty-two.</speak>`,
  async handle(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.trim());
    window.speechSynthesis.speak(utt);
  },
};
