// Common city → IANA timezone mapping
const CITY_TZ = {
  'NEW YORK':'America/New_York','NYC':'America/New_York','NEW YORK CITY':'America/New_York',
  'LOS ANGELES':'America/Los_Angeles','LA':'America/Los_Angeles',
  'CHICAGO':'America/Chicago','HOUSTON':'America/Chicago','DALLAS':'America/Chicago',
  'PHOENIX':'America/Phoenix','DENVER':'America/Denver',
  'SEATTLE':'America/Los_Angeles','PORTLAND':'America/Los_Angeles',
  'SAN FRANCISCO':'America/Los_Angeles','SF':'America/Los_Angeles',
  'LAS VEGAS':'America/Los_Angeles','SAN DIEGO':'America/Los_Angeles',
  'MIAMI':'America/New_York','BOSTON':'America/New_York',
  'ATLANTA':'America/New_York','WASHINGTON':'America/New_York','DC':'America/New_York',
  'LONDON':'Europe/London','UK':'Europe/London',
  'PARIS':'Europe/Paris','FRANCE':'Europe/Paris',
  'BERLIN':'Europe/Berlin','GERMANY':'Europe/Berlin',
  'MADRID':'Europe/Madrid','SPAIN':'Europe/Madrid',
  'ROME':'Europe/Rome','ITALY':'Europe/Rome',
  'AMSTERDAM':'Europe/Amsterdam','NETHERLANDS':'Europe/Amsterdam',
  'BRUSSELS':'Europe/Brussels','BELGIUM':'Europe/Brussels',
  'ZURICH':'Europe/Zurich','SWITZERLAND':'Europe/Zurich',
  'STOCKHOLM':'Europe/Stockholm','SWEDEN':'Europe/Stockholm',
  'OSLO':'Europe/Oslo','NORWAY':'Europe/Oslo',
  'COPENHAGEN':'Europe/Copenhagen','DENMARK':'Europe/Copenhagen',
  'HELSINKI':'Europe/Helsinki','FINLAND':'Europe/Helsinki',
  'WARSAW':'Europe/Warsaw','POLAND':'Europe/Warsaw',
  'PRAGUE':'Europe/Prague','CZECH REPUBLIC':'Europe/Prague',
  'BUDAPEST':'Europe/Budapest','HUNGARY':'Europe/Budapest',
  'BUCHAREST':'Europe/Bucharest','ROMANIA':'Europe/Bucharest',
  'ATHENS':'Europe/Athens','GREECE':'Europe/Athens',
  'ISTANBUL':'Europe/Istanbul','TURKEY':'Europe/Istanbul',
  'MOSCOW':'Europe/Moscow','RUSSIA':'Europe/Moscow',
  'DUBAI':'Asia/Dubai','UAE':'Asia/Dubai',
  'RIYADH':'Asia/Riyadh','SAUDI ARABIA':'Asia/Riyadh',
  'TEHRAN':'Asia/Tehran','IRAN':'Asia/Tehran',
  'KARACHI':'Asia/Karachi','PAKISTAN':'Asia/Karachi',
  'MUMBAI':'Asia/Kolkata','DELHI':'Asia/Kolkata','KOLKATA':'Asia/Kolkata',
  'INDIA':'Asia/Kolkata',
  'DHAKA':'Asia/Dhaka','BANGLADESH':'Asia/Dhaka',
  'BANGKOK':'Asia/Bangkok','THAILAND':'Asia/Bangkok',
  'HANOI':'Asia/Bangkok','HO CHI MINH':'Asia/Ho_Chi_Minh','VIETNAM':'Asia/Ho_Chi_Minh',
  'SINGAPORE':'Asia/Singapore','MALAYSIA':'Asia/Kuala_Lumpur',
  'KUALA LUMPUR':'Asia/Kuala_Lumpur',
  'JAKARTA':'Asia/Jakarta','INDONESIA':'Asia/Jakarta',
  'BEIJING':'Asia/Shanghai','SHANGHAI':'Asia/Shanghai','CHINA':'Asia/Shanghai',
  'HONG KONG':'Asia/Hong_Kong',
  'TAIPEI':'Asia/Taipei','TAIWAN':'Asia/Taipei',
  'TOKYO':'Asia/Tokyo','JAPAN':'Asia/Tokyo',
  'SEOUL':'Asia/Seoul','SOUTH KOREA':'Asia/Seoul','KOREA':'Asia/Seoul',
  'SYDNEY':'Australia/Sydney','MELBOURNE':'Australia/Melbourne',
  'BRISBANE':'Australia/Brisbane','AUSTRALIA':'Australia/Sydney',
  'AUCKLAND':'Pacific/Auckland','NEW ZEALAND':'Pacific/Auckland',
  'HONOLULU':'Pacific/Honolulu','HAWAII':'Pacific/Honolulu',
  'ANCHORAGE':'America/Anchorage','ALASKA':'America/Anchorage',
  'TORONTO':'America/Toronto','MONTREAL':'America/Toronto','CANADA':'America/Toronto',
  'VANCOUVER':'America/Vancouver',
  'MEXICO CITY':'America/Mexico_City','MEXICO':'America/Mexico_City',
  'SAO PAULO':'America/Sao_Paulo','RIO':'America/Sao_Paulo','BRAZIL':'America/Sao_Paulo',
  'BUENOS AIRES':'America/Argentina/Buenos_Aires','ARGENTINA':'America/Argentina/Buenos_Aires',
  'BOGOTA':'America/Bogota','COLOMBIA':'America/Bogota',
  'CAIRO':'Africa/Cairo','EGYPT':'Africa/Cairo',
  'JOHANNESBURG':'Africa/Johannesburg','SOUTH AFRICA':'Africa/Johannesburg',
  'NAIROBI':'Africa/Nairobi','KENYA':'Africa/Nairobi',
  'LAGOS':'Africa/Lagos','NIGERIA':'Africa/Lagos',
};

export default {
  tag: 'theretime',
  instruction: `THERETIME SKILL: To find the current time in a city or country, emit <theretime>city or country name</theretime>.

Examples:
- "What time is it in Tokyo?" → <theretime>Tokyo</theretime>
- "Current time in London" → <theretime>London</theretime>`,
  call(content) {
    const key = content.trim().toUpperCase();
    // Try city lookup first, then fall back to treating it as IANA timezone
    const tz = CITY_TZ[key] ?? content.trim();
    try {
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'long', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      }).format(new Date());
      return `${content}: ${formatted}`;
    } catch {
      return `Unknown city/timezone "${content}". Try a city name or IANA timezone like "Asia/Tokyo".`;
    }
  },
  async handle() {},
};
