const COLORS_3_4 = {
  30:'Black',31:'Red',32:'Green',33:'Yellow',34:'Blue',35:'Magenta',36:'Cyan',37:'White',
  90:'Bright Black (Gray)',91:'Bright Red',92:'Bright Green',93:'Bright Yellow',
  94:'Bright Blue',95:'Bright Magenta',96:'Bright Cyan',97:'Bright White',
};
const ATTRS = {
  0:'Reset',1:'Bold',2:'Dim',3:'Italic',4:'Underline',5:'Blink',7:'Reverse',8:'Hidden',9:'Strikethrough',
  21:'Double underline',22:'Normal weight',23:'No italic',24:'No underline',25:'No blink',27:'No reverse',28:'Visible',29:'No strikethrough',
};

// Strip all ANSI escape sequences from a string
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\x1b[^[]/g, '');
}

export default {
  tag: 'ansi',
  instruction: `ANSI COLOR CODE SKILL: To decode an ANSI escape code, emit <ansi>code</ansi>. To strip ANSI codes from text, emit <ansi>strip:text</ansi>.

Examples:
- "What is \\e[31m?" → <ansi>31</ansi>
- "Decode ANSI 1;32" → <ansi>1;32</ansi>
- "Strip ANSI from '\\e[32mhello\\e[0m'" → <ansi>strip:\x1b[32mhello\x1b[0m</ansi>`,
  call(content) {
    if (content.startsWith('strip:')) {
      const text    = content.slice(6);
      const stripped = stripAnsi(text);
      return `Stripped: ${stripped}\n(Removed ${text.length - stripped.length} chars of ANSI sequences)`;
    }
    // Strip escape prefix if present
    const codes = content.trim().replace(/^\\e\[|^\x1b\[|^\033\[/, '').replace(/m$/, '').split(';').map(Number);
    const results = [];
    for (const code of codes) {
      if (ATTRS[code] !== undefined) { results.push(`${code}: ${ATTRS[code]}`); continue; }
      if (code >= 30 && code <= 37)    { results.push(`${code}: Foreground ${COLORS_3_4[code]}`);     continue; }
      if (code >= 40 && code <= 47)    { results.push(`${code}: Background ${COLORS_3_4[code-10]}`);  continue; }
      if (code >= 90 && code <= 97)    { results.push(`${code}: Foreground ${COLORS_3_4[code]}`);     continue; }
      if (code >= 100 && code <= 107)  { results.push(`${code}: Background ${COLORS_3_4[code-60]}`);  continue; }
      if (code === 38 || code === 48)  { results.push(`${code}: 256-color or truecolor (needs full sequence)`); continue; }
      results.push(`${code}: Unknown`);
    }
    return results.join('\n');
  },
  async handle() {},
};
