// WGS84 ellipsoid constants
const a  = 6378137.0;          // semi-major axis (m)
const f  = 1 / 298.257223563;  // flattening
const b  = a * (1 - f);        // semi-minor axis
const e2 = 2 * f - f * f;      // eccentricity squared
const k0 = 0.9996;             // UTM scale factor
const E0 = 500000;             // false easting

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function latLonToUtm(lat, lon) {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const lon0 = toRad((zone - 1) * 6 - 180 + 3);
  const φ = toRad(lat), λ = toRad(lon);

  const N = a / Math.sqrt(1 - e2 * Math.sin(φ)**2);
  const T = Math.tan(φ)**2;
  const C = e2 / (1 - e2) * Math.cos(φ)**2;
  const A = Math.cos(φ) * (λ - lon0);

  const M = a * (
    (1 - e2/4 - 3*e2**2/64 - 5*e2**3/256) * φ
    - (3*e2/8 + 3*e2**2/32 + 45*e2**3/1024) * Math.sin(2*φ)
    + (15*e2**2/256 + 45*e2**3/1024) * Math.sin(4*φ)
    - (35*e2**3/3072) * Math.sin(6*φ)
  );

  const x = k0 * N * (A + (1-T+C)*A**3/6 + (5-18*T+T**2+72*C-58*(e2/(1-e2)))*A**5/120) + E0;
  const y = k0 * (M + N*Math.tan(φ)*(A**2/2 + (5-T+9*C+4*C**2)*A**4/24 + (61-58*T+T**2+600*C-330*(e2/(1-e2)))*A**6/720));
  const northing = lat < 0 ? y + 10000000 : y;
  const hemi = lat < 0 ? 'S' : 'N';

  // UTM zone letter
  const letters = 'CDEFGHJKLMNPQRSTUVWXX';
  const letter = letters[Math.floor((lat + 80) / 8)] ?? 'Z';

  return { zone, letter, easting: Math.round(x), northing: Math.round(northing), hemi };
}

function utmToLatLon(zone, hemi, easting, northing) {
  const x   = easting - E0;
  const y0  = hemi === 'S' ? northing - 10000000 : northing;
  const lon0 = toRad((zone - 1) * 6 - 180 + 3);

  const M  = y0 / k0;
  const μ  = M / (a * (1 - e2/4 - 3*e2**2/64 - 5*e2**3/256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const φ1 = μ + (3*e1/2 - 27*e1**3/32)*Math.sin(2*μ)
              + (21*e1**2/16 - 55*e1**4/32)*Math.sin(4*μ)
              + (151*e1**3/96)*Math.sin(6*μ)
              + (1097*e1**4/512)*Math.sin(8*μ);

  const N1 = a / Math.sqrt(1 - e2*Math.sin(φ1)**2);
  const T1 = Math.tan(φ1)**2;
  const C1 = e2/(1-e2)*Math.cos(φ1)**2;
  const R1 = a*(1-e2)/(1-e2*Math.sin(φ1)**2)**1.5;
  const D  = x / (N1 * k0);

  const lat = φ1 - (N1*Math.tan(φ1)/R1)*(D**2/2 - (5+3*T1+10*C1-4*C1**2-9*(e2/(1-e2)))*D**4/24
              + (61+90*T1+298*C1+45*T1**2-252*(e2/(1-e2))-3*C1**2)*D**6/720);
  const lon = lon0 + (D - (1+2*T1+C1)*D**3/6 + (5-2*C1+(28*T1)-(3*C1**2)+(8*(e2/(1-e2)))+(24*T1**2))*D**5/120) / Math.cos(φ1);

  return { lat: toDeg(lat), lon: toDeg(lon) };
}

export default {
  tag: 'proj',
  instruction: `COORDINATE PROJECTION SKILL: Convert between WGS84 (lat/lon) and UTM coordinates. call <|tool_call>call:proj{input:<|"|>lat,lon<|"|>}<tool_call|> or <|tool_call>call:proj{input:<|"|>zone,hemi,easting,northing<|"|>}<tool_call|>.

Examples:
- "Convert NYC to UTM" → <|tool_call>call:proj{input:<|"|>40.7128,-74.0060<|"|>}<tool_call|>
- "UTM to lat/lon: 18N 583960 4507523" → <|tool_call>call:proj{input:<|"|>18,N,583960,4507523<|"|>}<tool_call|>`,
  call(content) {
    content = content.trim();
    // UTM → lat/lon: "zone,hemi,easting,northing" or "zone hemi easting northing"
    const utmMatch = content.match(/^(\d{1,2})\s*,?\s*([NS])\s*,?\s*(\d+)\s*,?\s*(\d+)$/i);
    if (utmMatch) {
      const zone = parseInt(utmMatch[1]);
      const hemi = utmMatch[2].toUpperCase();
      const easting = parseFloat(utmMatch[3]);
      const northing = parseFloat(utmMatch[4]);
      if (zone < 1 || zone > 60) return 'UTM zone must be 1–60.';
      const { lat, lon } = utmToLatLon(zone, hemi, easting, northing);
      return [`UTM: ${zone}${hemi} ${easting}E ${northing}N`, `WGS84: ${lat.toFixed(6)}°, ${lon.toFixed(6)}°`].join('\n');
    }

    // lat/lon → UTM
    const parts = content.split(/[,\s]+/);
    const lat = parseFloat(parts[0]), lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) return 'Provide lat,lon (e.g. 40.7128,-74.0060) or zone,hemi,easting,northing';
    if (lat < -80 || lat > 84) return 'UTM only valid between 80°S and 84°N.';
    const { zone, letter, easting, northing, hemi } = latLonToUtm(lat, lon);
    return [`WGS84:  ${lat}°, ${lon}°`, `UTM:    Zone ${zone}${letter} (${hemi})  ${easting}E  ${northing}N`].join('\n');
  },
  async handle() {},
};
