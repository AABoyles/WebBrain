const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const DECODE_MAP = Object.fromEntries([...BASE32].map((c, i) => [c, i]));

function encode(lat, lon, precision = 9) {
  let minLat = -90, maxLat = 90, minLon = -180, maxLon = 180;
  let hash = '', bits = 0, even = true, bit = 0, charVal = 0;

  while (hash.length < precision) {
    if (even) {
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) { charVal |= (1 << (4 - bit)); minLon = mid; }
      else maxLon = mid;
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { charVal |= (1 << (4 - bit)); minLat = mid; }
      else maxLat = mid;
    }
    even = !even;
    if (bit < 4) { bit++; }
    else { hash += BASE32[charVal]; charVal = 0; bit = 0; }
  }
  return hash;
}

function decode(hash) {
  let minLat = -90, maxLat = 90, minLon = -180, maxLon = 180;
  let even = true;
  for (const ch of hash.toLowerCase()) {
    const val = DECODE_MAP[ch];
    if (val === undefined) throw new Error(`Invalid geohash char: ${ch}`);
    for (let b = 4; b >= 0; b--) {
      const bit = (val >> b) & 1;
      if (even) { const mid = (minLon + maxLon) / 2; if (bit) minLon = mid; else maxLon = mid; }
      else       { const mid = (minLat + maxLat) / 2; if (bit) minLat = mid; else maxLat = mid; }
      even = !even;
    }
  }
  const lat = (minLat + maxLat) / 2, lon = (minLon + maxLon) / 2;
  const latErr = (maxLat - minLat) / 2, lonErr = (maxLon - minLon) / 2;
  return { lat, lon, latErr, lonErr };
}

export default {
  tag: 'geohash',
  instruction: `GEOHASH SKILL: Encode lat/lng to Geohash or decode a Geohash string. Emit <geohash>lat,lon</geohash> or <geohash>hashstring</geohash>. Optionally add precision: <geohash>lat,lon,precision</geohash>.

Examples:
- "Geohash of NYC" → <geohash>40.7128,-74.0060</geohash>
- "Decode dr5regw3pg" → <geohash>dr5regw3pg</geohash>`,
  call(content) {
    content = content.trim().toLowerCase();
    // Check if it looks like a geohash (only base32 chars)
    if (/^[0123456789bcdefghjkmnpqrstuvwxyz]+$/.test(content) && !content.includes(',')) {
      try {
        const { lat, lon, latErr, lonErr } = decode(content);
        const dp = content.length <= 4 ? 2 : content.length <= 6 ? 4 : 6;
        return [
          `Geohash:  ${content}`,
          `Latitude: ${lat.toFixed(dp)} ± ${latErr.toFixed(dp)}°`,
          `Longitude: ${lon.toFixed(dp)} ± ${lonErr.toFixed(dp)}°`,
          `Approx error: ±${(Math.max(latErr, lonErr) * 111).toFixed(1)} km`,
        ].join('\n');
      } catch (e) { return `Geohash error: ${e.message}`; }
    }

    const parts = content.split(/,\s*/);
    const lat = parseFloat(parts[0]), lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) return 'Provide lat,lon (e.g. 40.7128,-74.0060) or a geohash string.';
    const precision = parts[2] ? Math.max(1, Math.min(12, parseInt(parts[2]))) : 9;
    const hash = encode(lat, lon, precision);
    return [
      `Geohash (precision ${precision}): ${hash}`,
      `Covers roughly: ±${precision <= 4 ? '20-2500' : precision <= 6 ? '0.6-20' : '< 0.6'} km`,
    ].join('\n');
  },
  async handle() {},
};
