// Pre-2011 area-number ranges → state (SSA historic assignment)
const AREA_STATES = [
  [[1,3],'New Hampshire'],[[4,7],'Maine'],[[8,9],'Vermont'],
  [[10,34],'Massachusetts'],[[35,39],'Rhode Island'],[[40,49],'Connecticut'],
  [[50,134],'New York'],[[135,158],'New Jersey'],[[159,211],'Pennsylvania'],
  [[212,220],'Maryland'],[[221,222],'Delaware'],[[223,231],'Virginia'],
  [[232,232],'North Carolina'],[[233,236],'West Virginia'],
  [[237,246],'North Carolina'],[[247,251],'South Carolina'],
  [[252,260],'Georgia'],[[261,267],'Florida'],[[268,302],'Ohio'],
  [[303,317],'Indiana'],[[318,361],'Illinois'],[[362,386],'Michigan'],
  [[387,399],'Wisconsin'],[[400,407],'Kentucky'],[[408,415],'Tennessee'],
  [[416,424],'Alabama'],[[425,428],'Mississippi'],[[429,432],'Arkansas'],
  [[433,439],'Louisiana'],[[440,448],'Oklahoma'],[[449,467],'Texas'],
  [[468,477],'Minnesota'],[[478,485],'Iowa'],[[486,500],'Missouri'],
  [[501,502],'North Dakota'],[[503,504],'South Dakota'],[[505,508],'Nebraska'],
  [[509,515],'Kansas'],[[516,517],'Montana'],[[518,519],'Idaho'],
  [[520,520],'Wyoming'],[[521,524],'Colorado'],[[525,525],'New Mexico'],
  [[526,527],'Arizona'],[[528,529],'Utah'],[[530,530],'Nevada'],
  [[531,539],'Washington'],[[540,544],'Oregon'],[[545,573],'California'],
  [[574,574],'Alaska'],[[575,576],'Hawaii'],[[577,579],'District of Columbia'],
  [[580,584],'US Virgin Islands'],[[585,585],'New Mexico'],
  [[586,586],'Pacific Islands'],[[587,599],'Various/Unassigned'],
  [[600,601],'Arizona'],[[602,626],'California'],[[627,645],'Texas'],
  [[646,647],'Unassigned'],[[648,649],'New Mexico'],
  [[650,699],'Unassigned'],[[700,728],'Railroad Board'],[[729,733],'Unassigned'],
  [[750,751],'Hawaii'],[[752,755],'Mississippi'],[[756,763],'Tennessee'],
  [[764,772],'Arizona'],[[773,899],'Unassigned'],
];

function getState(area) {
  for (const [[lo,hi],state] of AREA_STATES) {
    if (area >= lo && area <= hi) return state;
  }
  return 'Unknown';
}

export default {
  tag: 'ssn',
  instruction: `SSN DECODER SKILL: To analyze the structure of a US Social Security Number, emit <ssn>number</ssn>. Only structure/format is analyzed — nothing is stored.

Example: <ssn>123-45-6789</ssn>`,
  call(content) {
    const n = content.trim().replace(/[\s\-]/g, '');
    if (!/^\d{9}$/.test(n)) return 'SSNs are 9 digits (dashes optional).';
    const area   = parseInt(n.slice(0, 3));
    const group  = parseInt(n.slice(3, 5));
    const serial = parseInt(n.slice(5));
    const masked = `${n.slice(0,3)}-${n.slice(3,5)}-****`;

    const invalid = (area === 0 || area === 666 || area >= 900)
      ? 'Invalid area number'
      : group === 0 ? 'Invalid group number'
      : serial === 0 ? 'Invalid serial number'
      : null;

    return [
      `SSN: ${masked}`,
      `Area (pre-2011 state): ${area} → ${getState(area)}`,
      `Group number: ${String(group).padStart(2,'0')}`,
      `Serial number: ${String(serial).padStart(4,'0')}`,
      `Format check: ${invalid ?? '✓ structurally valid (not verified with SSA)'}`,
      `Note: Since 2011, SSA assigns numbers randomly; area no longer indicates state.`,
    ].join('\n');
  },
  async handle() {},
};
