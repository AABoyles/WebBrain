export default {
  tag: 'iss',
  instruction: `ISS POSITION SKILL: To get the current position of the International Space Station, call <|tool_call>call:iss{input:<|"|><|"|>}<tool_call|> (empty tag).

Example: "Where is the ISS right now?" → <|tool_call>call:iss{input:<|"|><|"|>}<tool_call|>`,
  async call() {
    try {
      const res = await fetch('http://api.open-notify.org/iss-now.json');
      if (!res.ok) return 'ISS API unavailable.';
      const { iss_position: pos, timestamp } = await res.json();
      const time = new Date(timestamp * 1000).toUTCString();
      const lat  = parseFloat(pos.latitude).toFixed(2);
      const lon  = parseFloat(pos.longitude).toFixed(2);
      const ns   = lat >= 0 ? 'N' : 'S';
      const ew   = lon >= 0 ? 'E' : 'W';
      return [`ISS Position at ${time}:`,`Latitude:  ${Math.abs(lat)}°${ns}`,`Longitude: ${Math.abs(lon)}°${ew}`,`The ISS orbits at ~408 km altitude at 7.66 km/s, completing one orbit every 92 minutes.`].join('\n');
    } catch (e) {
      return `ISS error: ${e.message}`;
    }
  },
  async handle() {},
};
