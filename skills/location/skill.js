export default {
  tag: 'location',
  instruction: `LOCATION SKILL: For questions about local weather, time zones, or nearby places, emit <location></location> to get the user's position first.

Examples:
- "What's the weather here?" → Let me check your location. <location></location>
- "What time zone am I in?" → <location></location>`,
  call: () => new Promise(resolve => {
    if (!navigator.geolocation) return resolve('Geolocation not available in this browser.');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const { address: a } = await res.json();
          const place = [a?.city || a?.town || a?.village || a?.county, a?.state, a?.country]
            .filter(Boolean).join(', ');
          resolve(`${place} (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`);
        } catch {
          resolve(`${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
        }
      },
      err => resolve(`Location unavailable: ${err.message}`)
    );
  }),
  async handle() {},
};
