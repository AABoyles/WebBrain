const BLOCKED = /\b(window|document|fetch|XMLHttpRequest|eval|Function|import|require|process|global|setTimeout|setInterval|clearTimeout|clearInterval|Worker|Blob|URL|indexedDB|localStorage|sessionStorage|navigator|location|history|crypto|performance|console)\b/;

export default {
  tag: 'calc',
  instruction: `CALCULATOR SKILL: For any arithmetic or math, emit <calc>JS expression</calc> — do NOT compute yourself. Use Math.* for functions.

Examples:
- "17 × 23?" → <calc>17 * 23</calc>
- "√144?" → <calc>Math.sqrt(144)</calc>
- "15% of $47.50?" → <calc>(47.5 * 0.15).toFixed(2)</calc>`,
  call(expr) {
    if (BLOCKED.test(expr) || /[`]/.test(expr)) return 'Error: disallowed expression';
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function('"use strict"; return (' + expr + ')')();
      return typeof result === 'number'
        ? (isFinite(result) ? parseFloat(result.toPrecision(10)).toString() : String(result))
        : String(result);
    } catch (e) {
      return 'Math error: ' + e.message;
    }
  },
  async handle() {},
};
