function vigenere(text, key, decode) {
  key = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return 'Key must contain at least one letter.';
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, c => {
    const base  = c < 'a' ? 65 : 97;
    const shift = key[ki++ % key.length].charCodeAt(0) - 65;
    const s     = decode ? 26 - shift : shift;
    return String.fromCharCode((c.charCodeAt(0) - base + s) % 26 + base);
  });
}

export default {
  tag: 'vigenere',
  instruction: `VIGENÈRE CIPHER SKILL: To encode or decode with the Vigenère polyalphabetic cipher, call <|tool_call>call:vigenere{input:<|"|>key:text<|"|>}<tool_call|> to encode or <|tool_call>call:vigenere{input:<|"|>decode:key:text<|"|>}<tool_call|> to decode.

Examples:
- "Encode 'Hello' with key SECRET" → <|tool_call>call:vigenere{input:<|"|>SECRET:Hello<|"|>}<tool_call|>
- "Decode 'Zincs' with key SECRET" → <|tool_call>call:vigenere{input:<|"|>decode:SECRET:Zincs<|"|>}<tool_call|>`,
  call(content) {
    const decode = content.toLowerCase().startsWith('decode:');
    const rest = decode ? content.slice(7) : content;
    const colon = rest.indexOf(':');
    if (colon === -1) return 'Format: key:text or decode:key:text';
    const key  = rest.slice(0, colon);
    const text = rest.slice(colon + 1);
    return vigenere(text, key, decode);
  },
  async handle() {},
};
