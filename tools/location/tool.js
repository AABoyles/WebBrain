let cached = null;

export default {
  tag: 'location',
  fetch: () => cached ?? new Promise(resolve => {
    if (!navigator.geolocation) {
      cached = 'Geolocation not available in this browser.';
      return resolve(cached);
    }
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
          cached = `User location: ${place} (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
          resolve(cached);
        } catch {
          cached = `User location: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
          resolve(cached);
        }
      },
      err => { cached = `Location unavailable: ${err.message}`; resolve(cached); }
    );
  }),
};
