// WMO weather code → description
const WMO = {
  0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
  45:'Fog',48:'Icy fog',51:'Light drizzle',53:'Moderate drizzle',55:'Dense drizzle',
  61:'Slight rain',63:'Moderate rain',65:'Heavy rain',
  71:'Slight snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',
  80:'Slight rain showers',81:'Moderate rain showers',82:'Violent rain showers',
  85:'Slight snow showers',86:'Heavy snow showers',
  95:'Thunderstorm',96:'Thunderstorm with slight hail',99:'Thunderstorm with heavy hail',
};

export default {
  tag: 'weather',
  instruction: `WEATHER SKILL: To get current weather at a location, call <|tool_call>call:weather{input:<|"|>lat,lon<|"|>}<tool_call|> or <|tool_call>call:weather{input:<|"|>city name<|"|>}<tool_call|> (for city names, use with the Location skill to get coordinates first).

Examples:
- "Current weather at 40.71,-74.01" → <|tool_call>call:weather{input:<|"|>40.71,-74.01<|"|>}<tool_call|>
- Use <|tool_call>call:location{input:<|"|><|"|>}<tool_call|> first to get user's coordinates, then pass them here.`,
  async call(content) {
    content = content.trim();
    // Try to parse lat,lon
    const coordMatch = content.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (!coordMatch) return 'Format: lat,lon (e.g. 40.71,-74.01). Use the Location skill first.';
    const [, lat, lon] = coordMatch;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relative_humidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph`;
      const res  = await fetch(url);
      if (!res.ok) return 'Weather fetch failed.';
      const { current } = await res.json();
      const { temperature_2m: temp, apparent_temperature: feels, weathercode: code, windspeed_10m: wind, relative_humidity_2m: humidity } = current;
      const desc = WMO[code] ?? `Code ${code}`;
      return [`Current weather at ${lat}, ${lon}:`,`Conditions: ${desc}`,`Temperature: ${temp}°F (feels like ${feels}°F)`,`Wind: ${wind} mph`,`Humidity: ${humidity}%`].join('\n');
    } catch (e) {
      return `Weather error: ${e.message}`;
    }
  },
  async handle() {},
};
