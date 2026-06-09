export default {
  tag: 'speak',
  instruction: `TEXT-TO-SPEECH SKILL: When asked to read something aloud, narrate, or speak text, call <|tool_call>call:speak{input:<|"|>text to say<|"|>}<tool_call|>. The browser will read it using the Web Speech API. Do not emit this tag unless the user explicitly asks for audio output.

Examples:
- "Say hello out loud" → Hello! <|tool_call>call:speak{input:<|"|>Hello! I'm WebBrain.<|"|>}<tool_call|>
- "Read that answer to me" → <|tool_call>call:speak{input:<|"|>The result is forty-two.<|"|>}<tool_call|>`,
  async handle(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.trim());
    window.speechSynthesis.speak(utt);
  },
};
