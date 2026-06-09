// UUID v1 timestamp: 100-ns intervals since 1582-10-15
const UUID1_EPOCH_OFFSET = 122192928000000000n; // 100-ns ticks between 1582-10-15 and 1970-01-01

function parseV1Time(uuid) {
  const hex = uuid.replace(/-/g, '');
  const timeLow  = hex.slice(0, 8);
  const timeMid  = hex.slice(8, 12);
  const timeHigh = hex.slice(13, 16); // skip version nibble
  const ticks = BigInt('0x' + timeHigh + timeMid + timeLow);
  const ms    = (ticks - UUID1_EPOCH_OFFSET) / 10000n;
  return new Date(Number(ms)).toISOString();
}

const VARIANTS = {
  '0': 'NCS backward compatibility',
  '1': 'NCS backward compatibility',
  '2': 'RFC 4122 (standard)',
  '3': 'RFC 4122 (standard)',
  '4': 'RFC 4122 (standard)',
  '5': 'RFC 4122 (standard)',
  '6': 'RFC 4122 (standard)',
  '7': 'RFC 4122 (standard)',
  '8': 'Microsoft GUID',
  '9': 'Microsoft GUID',
  'a': 'Microsoft GUID',
  'b': 'Microsoft GUID',
  'c': 'RFC 4122 (standard)',
  'd': 'RFC 4122 (standard)',
  'e': 'reserved',
  'f': 'reserved',
};

export default {
  tag: 'uuid-decode',
  instruction: `UUID DECODER SKILL: To decode the structure and metadata of a UUID, call <|tool_call>call:uuid-decode{input:<|"|>uuid<|"|>}<tool_call|>.

Examples:
- "Decode this UUID" → <|tool_call>call:uuid-decode{input:<|"|>550e8400-e29b-41d4-a716-446655440000<|"|>}<tool_call|>
- "What version is this UUID?" → <|tool_call>call:uuid-decode{input:<|"|>6ba7b810-9dad-11d1-80b4-00c04fd430c8<|"|>}<tool_call|>`,
  call(content) {
    const uuid = content.trim().toLowerCase();
    const re   = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-5])[0-9a-f]{3}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{12}$/;
    const m    = uuid.match(re);
    if (!m) return 'Not a valid RFC 4122 UUID (must be xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx).';

    const version = parseInt(m[1]);
    const varNib  = m[2];
    const lines   = [
      `UUID:    ${uuid}`,
      `Version: ${version}`,
      `Variant: ${VARIANTS[varNib] ?? 'unknown'}`,
    ];

    if (version === 1) {
      try {
        const ts = parseV1Time(uuid);
        const node = uuid.slice(-12);
        lines.push(`Timestamp: ${ts} (100-ns clock)`);
        lines.push(`Node (MAC-derived): ${node.match(/.{2}/g).join(':')}`);
      } catch {}
    } else if (version === 4) {
      lines.push('Content: random (122 bits of entropy)');
    } else if (version === 3) {
      lines.push('Content: MD5 hash of a namespace + name');
    } else if (version === 5) {
      lines.push('Content: SHA-1 hash of a namespace + name');
    } else if (version === 2) {
      lines.push('Content: DCE Security UUID (UID/GID embedded)');
    }

    return lines.join('\n');
  },
  async handle() {},
};
