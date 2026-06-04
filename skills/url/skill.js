export default {
  tag: 'url',
  instruction: `URL DISSECTOR SKILL: To break a URL into its components and explain each part, emit <url>the URL</url>.

Examples:
- "Explain this URL: https://example.com/path?q=1#section" → <url>https://example.com/path?q=1#section</url>`,
  call(content) {
    try {
      const u = new URL(content.trim());
      const lines = [
        `URL: ${u.href}`,
        `Scheme:   ${u.protocol.replace(':','')}`,
      ];
      if (u.username) lines.push(`Username: ${u.username}`);
      if (u.password) lines.push(`Password: ${'*'.repeat(u.password.length)}`);
      lines.push(`Host:     ${u.hostname}`);
      if (u.port) lines.push(`Port:     ${u.port}`);
      if (u.pathname && u.pathname !== '/') lines.push(`Path:     ${u.pathname}`);
      if (u.search) {
        lines.push(`Query:    ${u.search}`);
        const params = [...u.searchParams.entries()];
        for (const [k, v] of params) lines.push(`  ${k} = ${v}`);
      }
      if (u.hash) lines.push(`Fragment: ${u.hash}`);
      return lines.join('\n');
    } catch {
      return `Cannot parse as a URL: "${content.trim()}"`;
    }
  },
  async handle() {},
};
