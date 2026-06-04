const TEMP_IDX = { c: 0, celsius: 0, f: 1, fahrenheit: 1, k: 2, kelvin: 2 };
const TO_C   = [v => v, v => (v - 32) * 5 / 9, v => v - 273.15];
const FROM_C = [v => v, v => v * 9 / 5 + 32,   v => v + 273.15];

const TABLES = [
  // Length (metres)
  { mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 },
  // Mass (kg)
  { mg: 1e-6, g: 1e-3, kg: 1, t: 1e3, lb: 0.45359237, lbs: 0.45359237, oz: 0.02834952, st: 6.35029318 },
  // Volume (litres)
  { ml: 1e-3, cl: 0.01, dl: 0.1, l: 1, litre: 1, liter: 1, tsp: 4.92892e-3, tbsp: 0.01478676, floz: 0.02957353, cup: 0.23658824, cups: 0.23658824, pt: 0.47317647, qt: 0.94635295, gal: 3.78541178 },
  // Speed (m/s)
  { 'm/s': 1, 'km/h': 1 / 3.6, kmh: 1 / 3.6, kph: 1 / 3.6, mph: 0.44704, kn: 0.514444, kt: 0.514444, knots: 0.514444, 'ft/s': 0.3048 },
  // Area (m²)
  { mm2: 1e-6, cm2: 1e-4, m2: 1, km2: 1e6, in2: 6.4516e-4, ft2: 0.09290304, yd2: 0.83612736, mi2: 2.58999e6, acre: 4046.8564, acres: 4046.8564, ha: 1e4 },
  // Data (bytes)
  { b: 1, byte: 1, bytes: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4 },
];

function convertUnits(expr) {
  const m = expr.trim().match(/^(-?[\d.]+(?:[eE][+\-]?\d+)?)\s+(.+?)\s+to\s+(.+)$/i);
  if (!m) return 'Format: VALUE UNIT to UNIT — e.g. "5 mi to km"';
  const value = parseFloat(m[1]);
  if (isNaN(value)) return 'Invalid number.';
  const from = m[2].trim().toLowerCase().replace(/°/g, '');
  const to   = m[3].trim().toLowerCase().replace(/°/g, '');

  if (from in TEMP_IDX && to in TEMP_IDX) {
    const result = FROM_C[TEMP_IDX[to]](TO_C[TEMP_IDX[from]](value));
    return `${value} ${m[2]} = ${+result.toFixed(4)} ${m[3]}`;
  }

  for (const table of TABLES) {
    if (table[from] !== undefined && table[to] !== undefined) {
      const result = (value * table[from]) / table[to];
      return `${value} ${m[2]} = ${+result.toPrecision(7)} ${m[3]}`;
    }
  }
  return `Cannot convert "${m[2]}" to "${m[3]}".`;
}

export default {
  tag: 'convert',
  instruction: `UNIT CONVERTER SKILL: For unit conversions, emit <convert>VALUE UNIT to UNIT</convert>. Do not guess.

Examples:
- "5 miles in km?" → <convert>5 mi to km</convert>
- "100°F in Celsius?" → <convert>100 F to C</convert>
- "2.5 kg to pounds?" → <convert>2.5 kg to lb</convert>`,
  call: convertUnits,
  async handle() {},
};
