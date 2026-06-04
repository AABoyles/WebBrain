const RECORDS = {
  A:     'Maps a hostname to an IPv4 address. The most basic DNS record.',
  AAAA:  'Maps a hostname to an IPv6 address (4× the bits of A).',
  CNAME: 'Canonical Name — aliases one hostname to another. Cannot coexist with other records at the same name.',
  MX:    'Mail Exchanger — specifies which servers accept email for the domain. Has a priority value; lower = preferred.',
  TXT:   'Free-form text. Used for SPF (email auth), DKIM keys, domain ownership verification, and DMARC policies.',
  NS:    'Nameserver — delegates a zone to a set of authoritative DNS servers.',
  SOA:   'Start of Authority — one per zone; contains primary NS, admin email, serial number, and TTL refresh intervals.',
  PTR:   'Pointer — reverse DNS; maps an IP address back to a hostname. Lives in the in-addr.arpa zone.',
  SRV:   'Service record — specifies host + port for a named service (e.g. _xmpp._tcp). Has priority, weight, port, target.',
  CAA:   'Certification Authority Authorization — restricts which CAs may issue TLS certificates for the domain.',
  DS:    'Delegation Signer — links parent zone to child zone KSK in DNSSEC.',
  DNSKEY:'Public key for DNSSEC signing. Zone Key (ZSK) signs record sets; Key Signing Key (KSK) signs other DNSKEYs.',
  TLSA:  'TLS Authentication — pins a certificate or public key via DANE; requires DNSSEC.',
  NAPTR: 'Naming Authority Pointer — used in VoIP/SIP to map E.164 phone numbers to URIs.',
  SSHFP: 'Stores SSH host key fingerprints in DNS so clients can verify servers without prior TOFU.',
  DKIM:  'DomainKeys Identified Mail — not a DNS type but published as a TXT record; provides email signing.',
  SPF:   'Sender Policy Framework — published as TXT; lists IPs authorized to send mail for the domain.',
  DMARC: 'Domain-based Message Authentication — TXT record at _dmarc subdomain; specifies SPF/DKIM policy.',
};

export default {
  tag: 'dns',
  instruction: `DNS RECORD TYPES SKILL: To explain a DNS record type, emit <dns>type</dns>.

Examples:
- "What is an MX record?" → <dns>MX</dns>
- "Explain CNAME vs A" → call <dns>CNAME</dns> then <dns>A</dns>`,
  call(content) {
    const type = content.trim().toUpperCase();
    const desc = RECORDS[type];
    if (!desc) {
      const list = Object.keys(RECORDS).join(', ');
      return `Unknown record type "${type}". Known types: ${list}`;
    }
    return `${type} record: ${desc}`;
  },
  async handle() {},
};
