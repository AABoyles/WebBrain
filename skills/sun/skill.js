export default {
  tag: 'sun',
  instruction: `SUNRISE/SUNSET SKILL: To get sunrise and sunset times for a location, emit <sun>lat,lon</sun> or <sun>lat,lon YYYY-MM-DD</sun>.

Examples:
- "Sunrise in NYC today" → <sun>40.71,-74.01</sun>
- Use <location></location> first to get coordinates.`,
  async call(content) {
    content = content.trim();
    const parts = content.split(/\s+/);
    const coordStr = parts[0];
    const dateStr  = parts[1] ?? new Date().toISOString().slice(0,10);
    const coordMatch = coordStr.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
    if (!coordMatch) return 'Format: lat,lon (e.g. 40.71,-74.01)';
    const [,lat,lon] = coordMatch;
    try {
      const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`;
      const res = await fetch(url);
      if (!res.ok) return 'Sunrise-sunset fetch failed.';
      const { results, status } = await res.json();
      if (status !== 'OK') return `API error: ${status}`;
      const fmt = iso => new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'UTC',timeZoneName:'short'});
      return [`Sunrise/sunset for ${lat}, ${lon} on ${dateStr}:`,`Sunrise:    ${fmt(results.sunrise)}`,`Sunset:     ${fmt(results.sunset)}`,`Solar noon: ${fmt(results.solar_noon)}`,`Day length: ${results.day_length} seconds (${(results.day_length/3600).toFixed(1)} hours)`].join('\n');
    } catch (e) {
      return `Sunrise error: ${e.message}`;
    }
  },
  async handle() {},
};
