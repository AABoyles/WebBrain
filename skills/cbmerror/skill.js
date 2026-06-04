const ERRORS = {
  1: {msg:'TOO MANY FILES',   cause:'More than 128 open files.'},
  2: {msg:'FILE OPEN',        cause:'Tried to OPEN an already-open logical file number.'},
  3: {msg:'FILE NOT OPEN',    cause:'Tried to use a file that wasn\'t opened with OPEN.'},
  4: {msg:'FILE NOT FOUND',   cause:'File doesn\'t exist on disk.'},
  5: {msg:'DEVICE NOT PRESENT',cause:'The specified device number isn\'t connected.'},
  6: {msg:'NOT INPUT FILE',   cause:'Tried to read from an output-only file.'},
  7: {msg:'NOT OUTPUT FILE',  cause:'Tried to write to an input-only file.'},
  8: {msg:'MISSING FILE NAME',cause:'SAVE or LOAD issued without a filename.'},
  9: {msg:'ILLEGAL DEVICE NUMBER',cause:'Invalid device number (e.g. 0 for LOAD/SAVE).'},
  10:{msg:'NEXT WITHOUT FOR', cause:'NEXT statement without a matching FOR loop.'},
  11:{msg:'SYNTAX',           cause:'Unrecognizable command or incorrect statement syntax.'},
  12:{msg:'RETURN WITHOUT GOSUB',cause:'RETURN encountered but no GOSUB was active.'},
  13:{msg:'OUT OF DATA',      cause:'READ exceeded the number of DATA values.'},
  14:{msg:'ILLEGAL QUANTITY', cause:'Number out of range (e.g. negative SQR, LOG of zero).'},
  15:{msg:'OVERFLOW',         cause:'Result is too large for a floating-point number (>1.70141×10³⁸).'},
  16:{msg:'OUT OF MEMORY',    cause:'Not enough RAM for the program or its variables.'},
  17:{msg:'UNDEF\'D STATEMENT',cause:'GOTO/GOSUB refers to a non-existent line number.'},
  18:{msg:'BAD SUBSCRIPT',    cause:'Array index is outside the declared dimensions.'},
  19:{msg:'REDIM\'D ARRAY',   cause:'Tried to DIM an array that\'s already dimensioned.'},
  20:{msg:'DIVISION BY ZERO', cause:'Divided by zero or MOD 0.'},
  21:{msg:'ILLEGAL DIRECT',   cause:'Command only valid inside a program (e.g. GET in direct mode).'},
  22:{msg:'TYPE MISMATCH',    cause:'Mixed string and numeric types inappropriately.'},
  23:{msg:'STRING TOO LONG',  cause:'String exceeds 255 characters.'},
  24:{msg:'FILE DATA',        cause:'Data read from file doesn\'t match the variable type.'},
  25:{msg:'FORMULA TOO COMPLEX',cause:'Expression nesting is too deep for the BASIC interpreter.'},
  26:{msg:'CAN\'T CONTINUE',  cause:'CONT attempted after program was edited or never run.'},
  27:{msg:'UNDEF\'D FUNCTION',cause:'FN call for a function not defined with DEF FN.'},
  28:{msg:'VERIFY',           cause:'VERIFY found the file on disk differs from the program in memory.'},
  29:{msg:'LOAD',             cause:'LOAD error (checksum mismatch on tape).'},
  30:{msg:'BREAK',            cause:'RUN/STOP key was pressed.'},
};

export default {
  tag: 'cbmerror',
  instruction: `COMMODORE BASIC ERROR SKILL: To look up a Commodore BASIC error number, emit <cbmerror>number</cbmerror>.

Examples:
- "What is Commodore error 14?" → <cbmerror>14</cbmerror>
- "C64 error 22" → <cbmerror>22</cbmerror>`,
  call(content) {
    const n = parseInt(content.trim());
    const e = ERRORS[n];
    if (!e) return `No Commodore BASIC error ${n} in table. Valid: 1–30.`;
    return `Error ${n}: ?${e.msg} ERROR\nCause: ${e.cause}`;
  },
  async handle() {},
};
