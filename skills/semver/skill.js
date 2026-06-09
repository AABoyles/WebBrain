const RE = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\w.-]+))?(?:\+([\w.-]+))?$/;

function parseSemver(s) {
  const m = s.trim().match(RE);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ?? null, build: m[5] ?? null };
}

function compare(a, b) {
  // Returns -1, 0, 1
  for (const k of ['major','minor','patch']) {
    if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1;
  }
  // Pre-release: version without pre > version with pre
  if (!a.pre && b.pre) return 1;
  if (a.pre && !b.pre) return -1;
  if (a.pre && b.pre) return a.pre < b.pre ? -1 : a.pre > b.pre ? 1 : 0;
  return 0;
}

export default {
  tag: 'semver',
  instruction: `SEMVER PARSER SKILL: To parse or compare semantic versions, call <|tool_call>call:semver{input:<|"|>version<|"|>}<tool_call|> to decode one version, or <|tool_call>call:semver{input:<|"|>v1 vs v2<|"|>}<tool_call|> to compare two.

Examples:
- "Parse 1.2.3-beta.4+build.5" → <|tool_call>call:semver{input:<|"|>1.2.3-beta.4+build.5<|"|>}<tool_call|>
- "Is 2.0.0 newer than 1.9.9?" → <|tool_call>call:semver{input:<|"|>2.0.0 vs 1.9.9<|"|>}<tool_call|>`,
  call(content) {
    content = content.trim();
    const vsMatch = content.match(/^(.+?)\s+vs\s+(.+)$/i);
    if (vsMatch) {
      const a = parseSemver(vsMatch[1]);
      const b = parseSemver(vsMatch[2]);
      if (!a) return `Cannot parse "${vsMatch[1]}" as a semver.`;
      if (!b) return `Cannot parse "${vsMatch[2]}" as a semver.`;
      const r = compare(a, b);
      return r === 0 ? 'Equal versions.' : r > 0 ? `${vsMatch[1].trim()} > ${vsMatch[2].trim()} (newer)` : `${vsMatch[1].trim()} < ${vsMatch[2].trim()} (older)`;
    }
    const v = parseSemver(content);
    if (!v) return 'Not a valid semver. Format: MAJOR.MINOR.PATCH[-prerelease][+build]';
    return [
      `Version: ${content}`,
      `Major:   ${v.major}`,
      `Minor:   ${v.minor}`,
      `Patch:   ${v.patch}`,
      v.pre   ? `Pre-release: ${v.pre}` : null,
      v.build ? `Build meta:  ${v.build}` : null,
      `Stability: ${v.major === 0 ? 'initial development (0.x.x — API not stable)' : v.pre ? 'pre-release' : 'stable'}`,
    ].filter(Boolean).join('\n');
  },
  async handle() {},
};
