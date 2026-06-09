const CODES = {
  0:  'Success — command completed without error.',
  1:  'General error — catch-all for miscellaneous failures.',
  2:  'Misuse of shell builtins (Bash) — invalid syntax or missing argument.',
  126:'Command found but not executable — permission denied or not a binary.',
  127:'Command not found — $PATH issue or typo.',
  128:'Invalid exit argument — exit code outside 0–255.',
  130:'Script terminated by Ctrl+C (SIGINT = 128 + 2).',
  137:'Process killed by SIGKILL (128 + 9) — OOM killer or manual kill -9.',
  139:'Segmentation fault (128 + 11) — SIGSEGV, often a null pointer.',
  141:'Broken pipe (128 + 13) — SIGPIPE, e.g. head killed a pipeline.',
  143:'Graceful termination (128 + 15) — SIGTERM, e.g. docker stop.',
  // Common program-specific
  255:'Out-of-range exit code or SSH connection failure.',
};

// Signal-based exits: 128 + signal number
function fromSignal(code) {
  const sig = code - 128;
  if (sig < 1 || sig > 31) return null;
  const names = {1:'SIGHUP',2:'SIGINT',3:'SIGQUIT',6:'SIGABRT',9:'SIGKILL',11:'SIGSEGV',13:'SIGPIPE',15:'SIGTERM'};
  return names[sig] ? `Process killed by ${names[sig]} (signal ${sig})` : `Process killed by signal ${sig} (128 + ${sig})`;
}

export default {
  tag: 'exit',
  instruction: `EXIT CODE SKILL: To explain a shell or program exit code, call <|tool_call>call:exit{input:<|"|>code<|"|>}<tool_call|>.

Examples:
- "What does exit code 137 mean?" → <|tool_call>call:exit{input:<|"|>137<|"|>}<tool_call|>
- "Explain exit 0" → <|tool_call>call:exit{input:<|"|>0<|"|>}<tool_call|>`,
  call(content) {
    const code = parseInt(content.trim());
    if (isNaN(code) || code < 0 || code > 255) return 'Exit codes are 0–255.';
    if (CODES[code]) return `Exit ${code}: ${CODES[code]}`;
    if (code > 128) {
      const sig = fromSignal(code);
      if (sig) return `Exit ${code}: ${sig}`;
    }
    return `Exit ${code}: No standard meaning — application-defined.`;
  },
  async handle() {},
};
