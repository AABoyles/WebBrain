const R = 6371; // Earth radius km

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function haversine(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bearing(lat1, lon1, lat2, lon2) {
  const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function midpoint(lat1, lon1, lat2, lon2) {
  const φ1 = toRad(lat1), λ1 = toRad(lon1);
  const φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1);
  const Bx = Math.cos(φ2) * Math.cos(Δλ);
  const By = Math.cos(φ2) * Math.sin(Δλ);
  const φm = Math.atan2(Math.sin(φ1) + Math.sin(φ2), Math.sqrt((Math.cos(φ1) + Bx)**2 + By**2));
  const λm = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);
  return [toDeg(φm), toDeg(λm)];
}

function compassPoint(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function parseCoord(s) {
  // Accept "lat,lon" or "lat lon"
  const parts = s.trim().split(/[,\s]+/);
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0]), lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return [lat, lon];
}

export default {
  tag: 'geodist',
  instruction: `GEODISTANCE SKILL: Calculate distance, bearing, and midpoint between two locations. For named places (cities, landmarks, etc.), use your knowledge to convert to decimal lat/lon coordinates, then call <|tool_call>call:geodist{input:<|"|>lat1,lon1 to lat2,lon2<|"|>}<tool_call|>.

Examples:
- "Distance NYC to LA" → <|tool_call>call:geodist{input:<|"|>40.7128,-74.0060 to 34.0522,-118.2437<|"|>}<tool_call|>
- "Distance from Paris to Berlin" → <|tool_call>call:geodist{input:<|"|>48.8566,2.3522 to 52.5200,13.4050<|"|>}<tool_call|>
- "Distance from 51.5,-0.1 to 48.8,2.3" → <|tool_call>call:geodist{input:<|"|>51.5,-0.1 to 48.8,2.3<|"|>}<tool_call|>`,
  call(content) {
    const toIdx = content.toLowerCase().indexOf(' to ');
    if (toIdx < 0) return 'Format: lat1,lon1 to lat2,lon2';
    const c1 = parseCoord(content.slice(0, toIdx));
    const c2 = parseCoord(content.slice(toIdx + 4));
    if (!c1 || !c2) return 'Could not parse coordinates. Use decimal degrees: 40.7128,-74.0060 to 34.0522,-118.2437';
    const [lat1, lon1] = c1, [lat2, lon2] = c2;
    const km  = haversine(lat1, lon1, lat2, lon2);
    const mi  = km * 0.621371;
    const brg = bearing(lat1, lon1, lat2, lon2);
    const [mlat, mlon] = midpoint(lat1, lon1, lat2, lon2);
    return [
      `Distance:  ${km.toFixed(1)} km  (${mi.toFixed(1)} mi)`,
      `Bearing:   ${brg.toFixed(1)}° ${compassPoint(brg)} (from point 1 to point 2)`,
      `Midpoint:  ${mlat.toFixed(4)}, ${mlon.toFixed(4)}`,
    ].join('\n');
  },
  async handle() {},
};
