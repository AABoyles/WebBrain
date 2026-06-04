export default {
  tag: 'uuid',
  instruction: `UUID GENERATOR SKILL: To generate one or more random UUIDs (v4), emit <uuid>count</uuid> or just <uuid>1</uuid>.

Examples:
- "Generate a UUID" → <uuid>1</uuid>
- "Give me 5 UUIDs" → <uuid>5</uuid>`,
  call(content) {
    const n = Math.min(Math.max(parseInt(content.trim()) || 1, 1), 20);
    return Array.from({ length: n }, () => crypto.randomUUID()).join('\n');
  },
  async handle() {},
};
