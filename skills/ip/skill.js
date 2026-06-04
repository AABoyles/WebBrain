function ipToInt(ip) {
  return ip.split('.').reduce((n, o) => (n << 8) + parseInt(o), 0) >>> 0;
}

function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export default {
  tag: 'ip',
  instruction: `IPv4/CIDR SKILL: To analyze an IPv4 address or CIDR block, emit <ip>address</ip> or <ip>address/prefix</ip>.

Examples:
- "What subnet is 192.168.1.100/24?" → <ip>192.168.1.100/24</ip>
- "Analyze 10.0.0.0/8" → <ip>10.0.0.0/8</ip>`,
  call(content) {
    content = content.trim();
    const cidrMatch = content.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
    const ipMatch   = content.match(/^(\d+\.\d+\.\d+\.\d+)$/);

    if (!cidrMatch && !ipMatch) return 'Enter an IPv4 address (1.2.3.4) or CIDR block (1.2.3.4/24).';

    const ip     = cidrMatch ? cidrMatch[1] : ipMatch[1];
    const prefix = cidrMatch ? parseInt(cidrMatch[2]) : null;
    const ipInt  = ipToInt(ip);

    // Classify address
    const classes = [
      [ipToInt('10.0.0.0'), ipToInt('10.255.255.255'), 'Private (RFC 1918)'],
      [ipToInt('172.16.0.0'), ipToInt('172.31.255.255'), 'Private (RFC 1918)'],
      [ipToInt('192.168.0.0'), ipToInt('192.168.255.255'), 'Private (RFC 1918)'],
      [ipToInt('127.0.0.0'), ipToInt('127.255.255.255'), 'Loopback'],
      [ipToInt('169.254.0.0'), ipToInt('169.254.255.255'), 'Link-local (APIPA)'],
      [ipToInt('100.64.0.0'), ipToInt('100.127.255.255'), 'Carrier-grade NAT'],
      [ipToInt('224.0.0.0'), ipToInt('239.255.255.255'), 'Multicast'],
      [ipToInt('240.0.0.0'), ipToInt('255.255.255.255'), 'Reserved'],
    ];
    const classify = classes.find(([lo, hi]) => ipInt >= lo && ipInt <= hi)?.[2] ?? 'Public';
    const lines = [`IP: ${ip}`, `Type: ${classify}`];

    if (prefix !== null) {
      if (prefix < 0 || prefix > 32) return 'Prefix must be 0–32.';
      const mask     = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
      const network  = (ipInt & mask) >>> 0;
      const bcast    = (network | (~mask >>> 0)) >>> 0;
      const hosts    = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2;
      lines.push(
        `Prefix: /${prefix}`,
        `Subnet mask: ${intToIp(mask)}`,
        `Network:     ${intToIp(network)}`,
        `Broadcast:   ${intToIp(bcast)}`,
        `Host range:  ${intToIp(network + 1)} – ${intToIp(bcast - 1)}`,
        `Usable hosts: ${hosts.toLocaleString()}`,
      );
    }

    return lines.join('\n');
  },
  async handle() {},
};
