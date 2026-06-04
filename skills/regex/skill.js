export default {
  tag: 'regex',
  instruction: `REGEX TESTER SKILL: To test a regex pattern against a string, emit <regex>pattern|||test string</regex> (three pipes as separator). Add flags after the pattern: /pattern/flags|||string.

Examples:
- "Does /\\d+/ match 'abc123'?" → <regex>/\\d+/|||abc123</regex>
- "Test /foo/i against 'FOO bar'" → <regex>/foo/i|||FOO bar</regex>`,
  call(content) {
    const sep = content.indexOf('|||');
    if (sep === -1) return 'Format: pattern|||test string — e.g. /\\d+/|||abc123';
    const patStr  = content.slice(0, sep).trim();
    const subject = content.slice(sep + 3);
    try {
      let pattern, flags = 'g';
      const m = patStr.match(/^\/(.*)\/([gimsuy]*)$/);
      if (m) { pattern = m[1]; flags = m[2] || 'g'; }
      else    { pattern = patStr; }
      if (!flags.includes('g')) flags += 'g';
      const re      = new RegExp(pattern, flags);
      const matches = [...subject.matchAll(re)];
      if (!matches.length) return `No match for /${pattern}/${flags.replace('g','')} in "${subject}".`;
      const results = matches.map(m => `"${m[0]}" at index ${m.index}${m.length > 1 ? ` (groups: ${m.slice(1).map(g => JSON.stringify(g)).join(', ')})` : ''}`);
      return `${matches.length} match${matches.length !== 1 ? 'es' : ''}:\n${results.join('\n')}`;
    } catch (e) {
      return `Regex error: ${e.message}`;
    }
  },
  async handle() {},
};
