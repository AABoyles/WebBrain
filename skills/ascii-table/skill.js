const CTRL = {
  0:'NUL (null)',1:'SOH (start of heading)',2:'STX (start of text)',3:'ETX (end of text)',
  4:'EOT (end of transmission)',5:'ENQ (enquiry)',6:'ACK (acknowledge)',7:'BEL (bell)',
  8:'BS (backspace)',9:'HT (horizontal tab)',10:'LF (line feed / newline)',11:'VT (vertical tab)',
  12:'FF (form feed)',13:'CR (carriage return)',14:'SO (shift out)',15:'SI (shift in)',
  16:'DLE',17:'DC1 (XON)',18:'DC2',19:'DC3 (XOFF)',20:'DC4',21:'NAK',22:'SYN',23:'ETB',
  24:'CAN',25:'EM',26:'SUB / EOF (Ctrl+Z on Windows)',27:'ESC (escape)',
  28:'FS',29:'GS',30:'RS',31:'US',127:'DEL',
};

export default {
  tag: 'ascii-table',
  instruction: `ASCII TABLE SKILL: To look up a character by ASCII code or find the code for a character, emit <ascii-table>value</ascii-table>.

Examples:
- "ASCII code for A" → <ascii-table>A</ascii-table>
- "What is ASCII 65?" → <ascii-table>65</ascii-table>
- "ASCII control code 10" → <ascii-table>10</ascii-table>`,
  call(content) {
    content = content.trim();
    const n = parseInt(content);
    if (!isNaN(n) && String(n) === content) {
      if (n < 0 || n > 127) return 'Standard ASCII is 0–127.';
      const ctrl = CTRL[n];
      if (ctrl) return `ASCII ${n}: ${ctrl}`;
      const ch = String.fromCharCode(n);
      return `ASCII ${n}: '${ch}' (${n < 32 ? 'control' : n === 32 ? 'space' : 'printable'})`;
    }
    // Character lookup
    if (content.length === 1) {
      const code = content.charCodeAt(0);
      if (code > 127) return `'${content}' is not in standard ASCII (code ${code}).`;
      const ctrl = CTRL[code];
      return ctrl ? `'${content}': ASCII ${code} — ${ctrl}` : `'${content}': ASCII ${code}`;
    }
    return 'Enter a single character or a decimal code 0–127.';
  },
  async handle() {},
};
