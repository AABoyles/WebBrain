const SIGNALS = {
  SIGHUP:  {n:1,  desc:'Hangup. Terminal disconnected. Daemons use it to reload config.'},
  SIGINT:  {n:2,  desc:'Interrupt from keyboard (Ctrl+C). Default: terminate.'},
  SIGQUIT: {n:3,  desc:'Quit from keyboard (Ctrl+\\). Like SIGINT but also dumps core.'},
  SIGILL:  {n:4,  desc:'Illegal instruction. Process executed invalid CPU instruction.'},
  SIGTRAP: {n:5,  desc:'Trace/breakpoint trap. Used by debuggers.'},
  SIGABRT: {n:6,  desc:'Abort — from abort(3). Usually means assert() failed. Dumps core.'},
  SIGBUS:  {n:7,  desc:'Bus error — misaligned memory access or bad physical address.'},
  SIGFPE:  {n:8,  desc:'Floating-point exception (also integer divide-by-zero).'},
  SIGKILL: {n:9,  desc:'Kill — cannot be caught or ignored. Immediately terminates the process.'},
  SIGUSR1: {n:10, desc:'User-defined signal 1. Application-specific; often triggers log rotation.'},
  SIGSEGV: {n:11, desc:'Segmentation fault — invalid memory access. Usually a null/dangling pointer.'},
  SIGUSR2: {n:12, desc:'User-defined signal 2. Application-specific.'},
  SIGPIPE: {n:13, desc:'Broken pipe — write to a pipe/socket with no reader. Often causes silent exit.'},
  SIGALRM: {n:14, desc:'Alarm clock — fired by alarm(2). Used for timeouts.'},
  SIGTERM: {n:15, desc:'Terminate — graceful shutdown request. The default of kill(1). Can be caught.'},
  SIGSTKFLT:{n:16,desc:'Stack fault on coprocessor (obsolete on Linux).'},
  SIGCHLD: {n:17, desc:'Child process stopped or terminated. Parent can wait() for status.'},
  SIGCONT: {n:18, desc:'Continue a stopped process (fg/bg in shells).'},
  SIGSTOP: {n:19, desc:'Stop — like SIGKILL but suspends the process. Cannot be caught.'},
  SIGTSTP: {n:20, desc:'Terminal stop (Ctrl+Z). Can be caught (unlike SIGSTOP).'},
  SIGTTIN: {n:21, desc:'Background process attempted read from terminal.'},
  SIGTTOU: {n:22, desc:'Background process attempted write to terminal.'},
  SIGURG:  {n:23, desc:'Urgent data available on socket (out-of-band TCP data).'},
  SIGXCPU: {n:24, desc:'CPU time limit exceeded (ulimit -t).'},
  SIGXFSZ: {n:25, desc:'File size limit exceeded (ulimit -f).'},
  SIGVTALRM:{n:26,desc:'Virtual alarm clock — fires based on CPU time used by process.'},
  SIGPROF: {n:27, desc:'Profiling timer expired — used by profilers like gprof.'},
  SIGWINCH:{n:28, desc:'Window size change — terminal was resized.'},
  SIGIO:   {n:29, desc:'I/O now possible on a descriptor (async I/O).'},
  SIGPWR:  {n:30, desc:'Power failure (Linux-specific).'},
  SIGSYS:  {n:31, desc:'Bad syscall argument.'},
};

const BY_NUMBER = Object.fromEntries(Object.entries(SIGNALS).map(([k,v]) => [v.n, {name:k,...v}]));

export default {
  tag: 'signal',
  instruction: `UNIX SIGNAL SKILL: To look up a Unix signal by name or number, call <|tool_call>call:signal{input:<|"|>value<|"|>}<tool_call|>.

Examples:
- "What is SIGTERM?" → <|tool_call>call:signal{input:<|"|>SIGTERM<|"|>}<tool_call|>
- "What is signal 9?" → <|tool_call>call:signal{input:<|"|>9<|"|>}<tool_call|>`,
  call(content) {
    content = content.trim().toUpperCase();
    const byNum = BY_NUMBER[parseInt(content)];
    const byName = SIGNALS[content] ?? SIGNALS['SIG' + content];
    const entry = byNum ?? (byName ? {name: content, ...byName} : null);
    if (!entry) return `Unknown signal "${content}". Try a name (SIGTERM) or number (15).`;
    return `${entry.name} (${entry.n}): ${entry.desc}`;
  },
  async handle() {},
};
