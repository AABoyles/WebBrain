// A small but representative OUI → vendor table
const OUI = {
  '000000':'Xerox','000001':'Xerox','00000C':'Cisco','00000E':'Fujitsu','000010':'Sytek',
  '000011':'Normerel','000016':'Du Pont','000018':'Webster','00001A':'AMD','00001C':'APT',
  '00001D':'Cabletron','00001F':'DSC','000020':'3Com','000022':'Visual Technology',
  '000023':'ABB','000024':'Connect AS','000025':'Ramtek','000026':'SHA-KEN',
  '000028':'Prodigy','00002A':'TRW','000032':'GPT','000037':'Oxford Metrics',
  '00003B':'Promptus','000044':'Castelle','000046':'ISC','000047':'Nicolet Instruments',
  '000048':'Seiko Epson','000049':'Apricot','00004B':'ICL','00004C':'NEC',
  '000050':'Radisys','000055':'AT&T','000056':'Samsung','000059':'Helios',
  '00005A':'SK','00005B':'Eltec','00005D':'RCE','00005E':'IANA',
  '000062':'Bull','000063':'Hewlett-Packard','000064':'Yokogawa','000065':'Network General',
  '000069':'Cisco','00006B':'MIPS','00006D':'Case Technology','00006E':'Artisoft',
  '000073':'DuPont','000074':'Ameriquest','000077':'Interphase','000078':'Labtam',
  '000079':'Netronix','00007A':'Ardent','00007B':'Research Machines','00007D':'Network Intelligence',
  '000080':'Cray','000081':'Synoptics','000082':'Lectra Systemes','000084':'Aquila',
  '000086':'Megahertz','000089':'Cayman Systems','00008A':'Datahouse','00008E':'Solbourne',
  '000094':'Asante','000095':'Sony','000097':'Epoch','000098':'Cross Com',
  '00009F':'Ameriquest','0000A0':'Sanyo','0000A2':'Wellfleet','0000A3':'Network Application Tech',
  '0000A4':'Acorn','0000A5':'Compatible Systems','0000A6':'Network General',
  '0000A7':'Network Computing Devices','0000A8':'Stratus','0000A9':'Network Systems',
  '0000AA':'Xerox','0000AC':'Conware','0000AE':'Dynatech','0000AF':'Nuclear Data',
  '0000B0':'RND Networks','0000B3':'CIMLinc','0000B4':'Ericsson Group',
  '0000B5':'Datability','0000B7':'Dove','0000BB':'TRI-DATA','0000BC':'Allen-Bradley',
  '0000C0':'Western Digital','0000C1':'Olicom','0000C5':'Farallon','0000C6':'HP',
  '0000C8':'Altos','0000C9':'Emulex','0000CA':'LANta','0000CC':'Lanstar',
  '0000D0':'Develcon','0000D1':'Adaptec','0000D3':'Wang','0000D4':'PureData',
  '0000D7':'Dartmouth College','0000D8':'3Com','0000DD':'Gould','0000DE':'Unigraph',
  '0000E2':'Acer','0000E3':'Integrated Micro Products','0000E4':'In4Tel','0000E8':'Accton',
  '0000EE':'Network Designers','0000EF':'Alantec','0000F0':'Samsung','0000F2':'Spider',
  '0000F3':'Gandalf','0000F4':'Allied Telesis','0000F6':'Applied Microsystems',
  '0000F8':'DEC','0000FB':'Rechner zur Kommunikation','0000FD':'High Level Hardware',
  '000102':'BBN','00010E':'Netopia','000110':'Proprietary','000111':'Nortel Networks',
  '000114':'Leemon Industries','00011A':'Verilink','000120':'Himei Technologies',
  '00012B':'Entrada Networks','000134':'Motorola','000137':'Cisco','000143':'IEEE 802.3 standard',
  '000164':'Cisco','000174':'Cisco','0001C7':'Cisco','0001F6':'Association of Musical Electronics Industry',
  '000269':'Alcatel','0004AC':'IBM','0004E2':'Cisco','000502':'Apple',
  '00050C':'Cisco','00052A':'Cisco','000556':'Cisco','0005DC':'Cisco',
  '000625':'Sandy','00065B':'3Com','000669':'3Com','00066F':'Cisco',
  '0006F6':'3Com','0007B3':'Cisco','000827':'Apple','000849':'Cisco',
  '00089B':'Cisco','00090A':'Cisco','000919':'Cisco','000989':'Cisco',
  '0009B7':'Cisco','0009E8':'Cisco','000AE4':'Cisco','000B0E':'Netopia',
  '000B46':'Cisco','000B7D':'Cisco','000B85':'Cisco','000C10':'Cisco',
  '000C15':'Cisco','000C30':'Cisco','000C41':'Cisco','000C85':'Cisco',
  '000C86':'Cisco','000CE5':'Cisco','000D3A':'Microsoft','000D60':'Cisco',
  '000D65':'Cisco','000D97':'Cisco','000DA7':'Cisco','000DB3':'Cisco',
  '000DBD':'Cisco','000DC9':'Cisco','000DEC':'Cisco','000E08':'Cisco',
  '000E38':'Cisco','000E39':'Cisco','000E84':'Cisco','000EA6':'Cisco',
  '000EC4':'Cisco','000EF6':'Cisco','000F24':'Cisco','000F34':'Cisco',
  '000F90':'Cisco','000FA7':'Cisco','000FC5':'Cisco','000FFF':'Tuxia',
  '001000':'Cisco','001009':'Cisco','00100B':'Cisco','00100C':'Cisco',
  '001011':'Cisco','001014':'Cisco','001016':'Cisco','001017':'Cisco',
  '001018':'Cisco','00101F':'Cisco','001020':'Cisco','001021':'Cisco',
  '001024':'Cisco','001025':'Acer Netxus','001028':'Cisco','00102F':'Cisco',
  '001033':'Ericsson','001048':'Cisco','001060':'Cisco','00106F':'Cisco',
  '001079':'Cisco','001083':'Cisco','00108A':'Cisco','00108B':'Cisco',
  'B827EB':'Raspberry Pi','DC2382':'Raspberry Pi','E45F01':'Raspberry Pi',
  'B8AEED':'Raspberry Pi','28CDC1':'Raspberry Pi','3A35A1':'Raspberry Pi',
  'D83ADD':'Raspberry Pi','E45201':'Raspberry Pi',
  '001A2F':'Apple','001B63':'Apple','001C3F':'Apple','001CB3':'Apple',
  '001D4F':'Apple','001E52':'Apple','001E89':'Apple','001EC2':'Apple',
  '001FF3':'Apple','0021E9':'Apple','002241':'Apple','00236C':'Apple',
  '0025BC':'Apple','002608':'Apple','0026BB':'Apple','002713':'Apple',
  '28CF8A':'Apple','34159E':'Apple','34363B':'Apple','38B54D':'Apple',
  'F0D1A9':'Apple','F4F15A':'Apple','F81EDF':'Apple',
  '00155D':'Microsoft','001DD8':'Microsoft','0017FA':'Microsoft',
  '001DDC':'Microsoft','00224D':'Microsoft','28F10E':'Microsoft',
  '3C83A2':'Microsoft','486844':'Microsoft','50B7C3':'Microsoft',
  '000C29':'VMware','000569':'VMware','001C14':'VMware','005056':'VMware',
  '00163E':'Xen','00155D':'Hyper-V',
};

function lookupOUI(mac) {
  const oui = mac.replace(/[:\-\.]/g, '').toUpperCase().slice(0, 6);
  return OUI[oui] ?? 'Unknown vendor';
}

export default {
  tag: 'mac',
  instruction: `MAC ADDRESS SKILL: To decode a MAC address, emit <mac>address</mac>. Accepts any common format (colons, dashes, dots).

Examples:
- "Who made this NIC? 00:1A:2B:3C:4D:5E" → <mac>00:1A:2B:3C:4D:5E</mac>
- "Decode MAC b8:27:eb:ab:cd:ef" → <mac>b8:27:eb:ab:cd:ef</mac>`,
  call(content) {
    const raw = content.trim();
    const hex = raw.replace(/[:\-\.\s]/g, '').toUpperCase();
    if (!/^[0-9A-F]{12}$/.test(hex)) return 'Enter a 12-hex-digit MAC address (colons, dashes, or dots OK).';

    const oui     = hex.slice(0, 6);
    const nic     = hex.slice(6);
    const first   = parseInt(hex.slice(0, 2), 16);
    const multicast  = (first & 1) === 1;
    const localAdmin = (first & 2) === 2;
    const vendor  = lookupOUI(raw);

    return [
      `MAC: ${hex.match(/.{2}/g).join(':')}`,
      `OUI (vendor prefix): ${oui} → ${vendor}`,
      `NIC specific: ${nic}`,
      `Unicast/Multicast: ${multicast ? 'Multicast' : 'Unicast'}`,
      `Scope: ${localAdmin ? 'Locally administered (may be spoofed/virtual)' : 'Globally unique (manufacturer-assigned)'}`,
    ].join('\n');
  },
  async handle() {},
};
