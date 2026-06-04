// ── IPv4 helpers ──────────────────────────────────────────────────────────────
function ipToInt(ip) { return ip.split('.').reduce((n, o) => (n << 8) + parseInt(o), 0) >>> 0; }
function intToIp(n) { return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.'); }

// ── IPv6 helpers ──────────────────────────────────────────────────────────────
// Expand :: shorthand and return 8 groups of 16-bit BigInts
function expandV6(addr) {
  // Remove leading/trailing colons from ::
  if (addr.includes('::')) {
    const [left, right] = addr.split('::');
    const l = left  ? left.split(':')  : [];
    const r = right ? right.split(':') : [];
    const fill = Array(8 - l.length - r.length).fill('0');
    return [...l, ...fill, ...r].map(g => parseInt(g || '0', 16));
  }
  return addr.split(':').map(g => parseInt(g, 16));
}
function v6ToBigInt(groups) { return groups.reduce((n, g) => (n << 16n) | BigInt(g), 0n); }
function bigIntToV6(n) {
  const gs = [];
  for (let i = 0; i < 8; i++) { gs.unshift(Number(n & 0xffffn)); n >>= 16n; }
  // Find longest run of consecutive zero groups
  let bestStart = -1, bestLen = 0, run = 0;
  for (let i = 0; i < 8; i++) {
    if (gs[i] === 0) { if (++run > bestLen) { bestLen = run; bestStart = i - run + 1; } }
    else run = 0;
  }
  if (bestLen <= 1) return gs.map(g => g.toString(16)).join(':');
  const left  = gs.slice(0, bestStart).map(g => g.toString(16)).join(':');
  const right = gs.slice(bestStart + bestLen).map(g => g.toString(16)).join(':');
  return (left ? left + '::' : '::') + right;
}
function isV6(s) { return s.includes(':'); }

function classifyV6(groups) {
  const n = v6ToBigInt(groups);
  if (n === 1n) return 'Loopback (::1)';
  if (n === 0n) return 'Unspecified (::)';
  const hi = BigInt(groups[0]);
  if ((hi & 0xffc0n) === 0xfe80n) return 'Link-local (fe80::/10)';
  if ((hi & 0xfe00n) === 0xfc00n) return 'Unique local (ULA, fc00::/7)';
  if ((hi >> 8n) === 0xffn)       return 'Multicast (ff00::/8)';
  if ((n >> 32n) === 0xffffn)     return 'IPv4-mapped (::ffff:0:0/96)';
  return 'Global unicast';
}

function analyzeV6(content) {
  const slashPos = content.lastIndexOf('/');
  const addr   = slashPos >= 0 ? content.slice(0, slashPos) : content;
  const prefix = slashPos >= 0 ? parseInt(content.slice(slashPos + 1)) : null;

  let groups;
  try { groups = expandV6(addr); } catch { return 'Invalid IPv6 address.'; }
  if (groups.length !== 8 || groups.some(isNaN)) return 'Invalid IPv6 address.';

  const full    = groups.map(g => g.toString(16).padStart(4, '0')).join(':');
  const compact = bigIntToV6(v6ToBigInt(groups));
  const type    = classifyV6(groups);
  const lines   = [`Address:  ${addr}`, `Full:     ${full}`, `Compact:  ${compact}`, `Type:     ${type}`];

  if (prefix !== null) {
    if (prefix < 0 || prefix > 128) return 'IPv6 prefix must be 0–128.';
    const ipBig  = v6ToBigInt(groups);
    const maskBig = prefix === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - prefix)) - 1n);
    const netBig  = ipBig & maskBig;
    lines.push(
      `Prefix:   /${prefix}`,
      `Network:  ${bigIntToV6(netBig)}/${prefix}`,
      `Addresses: 2^${128 - prefix} = ${prefix < 100 ? (2n ** BigInt(128 - prefix)).toLocaleString() : '(very large)'}`,
    );
  }
  return lines.join('\n');
}

// ── IPv4 analysis ─────────────────────────────────────────────────────────────
function analyzeV4(content) {
  const cidrMatch = content.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  const ipMatch   = content.match(/^(\d+\.\d+\.\d+\.\d+)$/);
  if (!cidrMatch && !ipMatch) return null;

  const ip     = cidrMatch ? cidrMatch[1] : ipMatch[1];
  const prefix = cidrMatch ? parseInt(cidrMatch[2]) : null;
  const ipInt  = ipToInt(ip);

  const ranges = [
    [ipToInt('10.0.0.0'), ipToInt('10.255.255.255'), 'Private (RFC 1918)'],
    [ipToInt('172.16.0.0'), ipToInt('172.31.255.255'), 'Private (RFC 1918)'],
    [ipToInt('192.168.0.0'), ipToInt('192.168.255.255'), 'Private (RFC 1918)'],
    [ipToInt('127.0.0.0'), ipToInt('127.255.255.255'), 'Loopback'],
    [ipToInt('169.254.0.0'), ipToInt('169.254.255.255'), 'Link-local (APIPA)'],
    [ipToInt('100.64.0.0'), ipToInt('100.127.255.255'), 'Carrier-grade NAT'],
    [ipToInt('224.0.0.0'), ipToInt('239.255.255.255'), 'Multicast'],
    [ipToInt('240.0.0.0'), ipToInt('255.255.255.255'), 'Reserved'],
  ];
  const type = ranges.find(([lo, hi]) => ipInt >= lo && ipInt <= hi)?.[2] ?? 'Public';
  const lines = [`IP:   ${ip}`, `Type: ${type}`];

  if (prefix !== null) {
    if (prefix < 0 || prefix > 32) return 'Prefix must be 0–32.';
    const mask  = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    const net   = (ipInt & mask) >>> 0;
    const bcast = (net | (~mask >>> 0)) >>> 0;
    const hosts = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2;
    lines.push(
      `Prefix:       /${prefix}`,
      `Subnet mask:  ${intToIp(mask)}`,
      `Network:      ${intToIp(net)}`,
      `Broadcast:    ${intToIp(bcast)}`,
      `Host range:   ${intToIp(net + 1)} – ${intToIp(bcast - 1)}`,
      `Usable hosts: ${hosts.toLocaleString()}`,
    );
  }
  return lines.join('\n');
}

export default {
  tag: 'ip',
  instruction: `IP ADDRESS SKILL: Analyze an IPv4 or IPv6 address (with optional CIDR prefix). Emit <ip>address</ip> or <ip>address/prefix</ip>.

Examples:
- "What subnet is 192.168.1.100/24?" → <ip>192.168.1.100/24</ip>
- "Analyze 2001:db8::1/48" → <ip>2001:db8::1/48</ip>`,
  call(content) {
    content = content.trim();
    if (isV6(content)) return analyzeV6(content);
    const v4result = analyzeV4(content);
    if (v4result !== null) return v4result;
    return 'Enter an IPv4 address (1.2.3.4), CIDR block (1.2.3.4/24), or IPv6 address (::1).';
  },
  async handle() {},
};
