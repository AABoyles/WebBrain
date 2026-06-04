# TODO

## New Skills

### Client-side only (Web APIs, zero external dependencies)

- [x] **Dice roller** (`<roll>`) — `crypto.getRandomValues`; supports `d20`, `2d6+3`, `heads|tails`, etc.
- [x] **Text-to-speech** (`<speak>`) — Web Speech API; model can narrate answers aloud
- [x] **Password generator** (`<password>`) — `crypto.getRandomValues`; configurable length and character sets
- [x] **Encode / decode** (`<encode>`) — `btoa`/`atob`/`encodeURIComponent`; base64, URL encoding, etc.
- [x] **Color converter** (`<color>`) — pure math; hex ↔ rgb ↔ hsl conversions
- [x] **Time zone converter** (`<tz>`) — `Intl.DateTimeFormat`; e.g. `3pm EST to PST`
- [x] **Hash** (`<hash>`) — `crypto.subtle.digest`; SHA-256 and friends
- [x] **ROT13** (`<rot13>`)
- [x] **Caesar Cipher** (`<caesar>`)
- [x] **Morse Code** (`<morse>`)

### Audio (Web Audio API — zero deps, works offline)

- [x] **Tone generator** (`<tone>`) — play a pure sine wave at a given Hz or musical note; useful for tuning instruments, hearing tests, tinnitus masking
- [x] **Metronome** (`<metronome>`) — click track at a given BPM; start/stop via tag
- [x] **Morse audio** (`<morse-audio>`) — encode text and play it as actual beeps via Web Audio; pairs with the Morse Code text skill
- [x] **DTMF tones** (`<dtmf>`) — generate phone keypad tones; playful and surprisingly nostalgic

### Text transformation & codes

- [x] **NATO phonetic** (`<nato>`) — "Tony" → "Tango Oscar November Yankee"; pure lookup table, useful for spelling things over the phone
- [x] **Number to words** (`<n2w>`) — 1,234 → "one thousand two hundred thirty-four"; pure JS logic
- [x] **Roman numerals** (`<roman>`) — convert to/from; `<roman>2024</roman>` → `MMXXIV`
- [x] **Radix converter** (`<radix>`) — `<radix>255 to hex</radix>` → `FF`; bin/oct/dec/hex; useful for developers
- [x] **Flip text** (`<flip>`) — upside-down Unicode text using a character map; pure novelty but people love it
- [x] **Pig Latin** (`<piglatin>`) — classic childhood cipher; pure string manipulation
- [x] **Leet speak** (`<leet>`) — 1337 5p34k; pure substitution table
- [x] **Pirate speak** (`<pirate>`) — word-substitution table; "hello" → "ahoy"; fun for the persona
- [x] **Scrabble score** (`<scrabble>`) — calculate tile point value for a word; pure lookup table
- [x] **Haiku checker** (`<haiku>`) — count syllables per line and verify 5-7-5 structure; algorithmic syllable counter
- [x] **Readability score** (`<flesch>`) — Flesch-Kincaid reading ease score from pasted text; pure math on word/sentence/syllable counts

### Math & science

- [x] **Statistics** (`<stats>`) — mean, median, mode, std dev, min/max for a comma-separated list of numbers; genuinely useful
- [x] **Compound interest** (`<compound>`) — `<compound>1000 at 7% for 20 years</compound>`; pure math
- [x] **Sleep cycles** (`<sleep>`) — given a bedtime or wake-up target, suggest optimal times based on 90-minute REM cycles
- [x] **Fibonacci / sequences** (`<seq>`) — generate terms of Fibonacci, primes, triangular numbers, etc.
- [x] **Prime factorizer** (`<factor>`) — factor any integer; pure JS
- [x] **Day of week oracle** (`<dayofweek>`) — what day was/will any date fall on? Zeller's formula, pure JS

### Games & randomness

- [x] **Magic 8-ball** (`<8ball>`) — 20 canonical responses, `crypto.getRandomValues`; delightful
- [x] **Tarot draw** (`<tarot>`) — draw one or three cards from a full 78-card deck with built-in meanings; `crypto.getRandomValues`
- [x] **Rock paper scissors** (`<rps>`) — play against the browser; crypto-random choice

### Time & date

- [x] **Countdown** (`<countdown>`) — time remaining until a specific date/event; pure JS date math
- [x] **Poetic time** (`<poetictime>`) — render current time in natural language ("quarter past midnight", "nearly noon")
- [x] **Day progress** (`<daypct>`) — what percentage of the day/week/year has elapsed; great for journaling

### Developer tools

- [x] **Regex tester** (`<regex>`) — test a pattern against a string; `crypto.getRandomValues`-safe, pure JS
- [x] **JSON formatter** (`<json>`) — pretty-print or minify JSON; `JSON.parse`/`JSON.stringify`, catches malformed input
- [ ] **Diff** (`<diff>`) — character- or line-level diff of two strings; pure JS longest-common-subsequence
- [x] **UUID generator** (`<uuid>`) — `crypto.randomUUID()`; one-liner but genuinely handy

### Extended memory & journaling (IndexedDB)

- [x] **Dream log** (`<dream>`) — timestamped dream entries in a dedicated IndexedDB store; indexed by date for retrieval
- [x] **Gratitude entry** (`<grateful>`) — one-sentence gratitude log; retrievable by the model for reflection prompts
- [x] **Habit tracker** (`<habit>`) — log a named habit as done for today; model can query streaks

### ID & document decoders (pure lookup tables + check-digit algorithms)

- [x] **VIN decoder** (`<vin>`) — World Manufacturer Identifier, model year encoding, plant code, check digit validation (NHTSA formula)
- [x] **Credit card decoder** (`<cc>`) — Luhn algorithm validation, IIN prefix → issuer (Visa/MC/Amex/Discover/JCB/UnionPay), length check; never stores the number
- [x] **SSN decoder** (`<ssn>`) — pre-2011 area-number → issuing state lookup, group/serial structure; flags obviously invalid numbers
- [x] **ISBN decoder** (`<isbn>`) — check digit validation, publisher prefix group, ISBN-10 ↔ ISBN-13 conversion
- [x] **IBAN decoder** (`<iban>`) — country code, check digit (MOD-97), BBAN structure; validates and explains each field
- [ ] ~~**SWIFT / BIC decoder** (`<swift>`) — bank code, country, location, branch; pure lookup~~ (skipped)
- [ ] ~~**ABA routing number** (`<aba>`) — Federal Reserve district prefix, check digit algorithm~~ (skipped)
- [ ] ~~**EIN decoder** (`<ein>`) — Employer Identification Number prefix → IRS campus that assigned it~~ (skipped)
- [x] **UUID decoder** (`<uuid-decode>`) — version (1/3/4/5), variant, timestamp extraction for v1, namespace for v3/v5
- [x] **UPC / EAN barcode** (`<upc>`) — check digit validation, GS1 company prefix structure
- [x] **IMEI decoder** (`<imei>`) — TAC → device type, Luhn check; pure algorithm

### Format & protocol parsers

- [x] **Semver parser** (`<semver>`) — `1.2.3-beta.4+build.5` → major, minor, patch, pre-release, build metadata; range comparison
- [x] **Cron expression** (`<cron>`) — `0 9 * * 1` → "Every Monday at 9:00 AM"; pure parser
- [ ] **JWT decoder** (`<jwt>`) — base64url-decode header and payload, display claims; no signature verification (by design)
- [ ] **IPv4 / CIDR** (`<ip>`) — subnet mask, network/broadcast address, host range, number of hosts; pure bit math
- [ ] **MAC address** (`<mac>`) — OUI prefix → manufacturer; first-octet flags (unicast/multicast, locally administered)
- [ ] **Unix timestamp** (`<epoch>`) — epoch ↔ human date in any direction; also shows "time ago / from now"
- [ ] **ISO 8601 duration** (`<duration>`) — `P1Y2M3DT4H5M6S` → "1 year, 2 months, 3 days, 4 hours…"
- [ ] **URL dissector** (`<url>`) — parse any URL into scheme, auth, host, TLD, path, query params, fragment; explain each part
- [ ] **MIME type** (`<mime>`) — extension → type or type → extension; built-in table of ~150 common types
- [ ] **HTTP status** (`<http>`) — `418` → "I'm a Teapot (RFC 2324)"; full table including WebDAV, nginx, Cloudflare codes
- [ ] **TCP port** (`<port>`) — well-known port → service; `443` → HTTPS, `22` → SSH, `6379` → Redis, etc.
- [ ] **DNS record types** (`<dns>`) — explain what A, AAAA, CNAME, MX, TXT, SRV, CAA, SOA records do
- [ ] **Unix signal** (`<signal>`) — `SIGTERM` ↔ `15`; explains default behavior and when each is used
- [ ] **Exit code** (`<exit>`) — `137` → OOM-killed (128+SIGKILL); common shell and program exit codes

### More ciphers & encodings

- [ ] **Vigenère cipher** (`<vigenere>`) — polyalphabetic substitution; encode/decode with keyword
- [ ] **Atbash cipher** (`<atbash>`) — Hebrew mirror cipher; A↔Z, B↔Y; works on any alphabet
- [ ] **Rail fence cipher** (`<railfence>`) — zigzag transposition; encode/decode with rail count
- [ ] **Pigpen cipher** (`<pigpen>`) — Masonic cipher; encode to Unicode block characters approximating the grid symbols
- [ ] **Tap code** (`<tap>`) — prison wall-tapping code (5×5 Polybius square); encode/decode
- [ ] **Polybius square** (`<polybius>`) — 5×5 grid encoding; coordinates for each letter
- [ ] **Baconian cipher** (`<bacon>`) — Francis Bacon's biliteral cipher; A/B or X/Y substitution
- [ ] **Braille** (`<braille>`) — encode English text to Unicode Braille block characters; Grade 1 only
- [ ] **Semaphore** (`<semaphore>`) — flag semaphore letter descriptions as compass positions

### Music theory (pure math & lookup)

- [ ] **MIDI note decoder** (`<midi>`) — note number ↔ note name; `60` → `C4 (middle C)`, `440Hz` → `A4`
- [ ] **Frequency → note** (`<freq2note>`) — nearest musical note and cents deviation from exact pitch
- [ ] **Key & scale** (`<scale>`) — given a root + mode, list all notes; C major, D dorian, F# phrygian, etc.
- [ ] **Chord identifier** (`<chord>`) — given note names, identify the chord and its inversions
- [ ] **Interval calculator** (`<interval>`) — C → G = perfect fifth; direction-aware, handles enharmonics
- [ ] **Circle of fifths** (`<fifths>`) — given a key, show neighbors, relative minor, parallel minor, key signature
- [ ] **BPM ↔ ms** (`<bpm>`) — `120 BPM` → `500ms per beat, 125ms per 16th`; useful for music production

### Geography & country lookup tables

- [ ] **Country info** (`<country>`) — ISO code → capital, currency, calling code, TLD, flag emoji, languages, continent
- [ ] **Flag emoji** (`<flag>`) — country name or code → flag emoji; pure Unicode regional indicator magic
- [ ] **Airport code** (`<airport>`) — IATA/ICAO code → city and airport name; built-in table of the ~300 busiest
- [ ] **Currency** (`<currency>`) — ISO 4217 code → name, symbol, countries that use it
- [ ] **Calling code** (`<dialcode>`) — country → `+1`, `+44`, etc.; or reverse lookup
- [ ] **US ZIP prefix** (`<zip>`) — first 3 digits → state/region; rough geographic area without exact DB
- [ ] **US state** (`<state>`) — abbreviation ↔ full name, capital, admission date, nickname
- [ ] **What time is it there?** (`<theretime>`) — convert "now" to any named city's local time via Intl.DateTimeFormat

### Science & nature lookup

- [ ] **Periodic table** (`<element>`) — symbol or name → atomic number, weight, period, group, state, discovery year, fun fact
- [ ] **Mohs hardness** (`<mohs>`) — hardness value → example mineral and what it can scratch/be scratched by
- [ ] **Beaufort scale** (`<beaufort>`) — wind force number → description, sea state, land effects
- [ ] **Fujita scale** (`<fujita>`) — EF rating → wind speed range, expected damage
- [ ] **Cloud types** (`<cloud>`) — name → altitude, description, weather association (cumulonimbus, lenticular, mammatus…)
- [ ] **Collective nouns** (`<collective>`) — `crows` → "a murder", `owls` → "a parliament", `flamingos` → "a flamboyance"
- [ ] **Baby animal names** (`<babyname>`) — `kangaroo` → joey, `fox` → kit, `platypus` → puggle
- [ ] **Animal sounds** (`<sound>`) — `fox` → "screams / gekkering"; goes beyond the obvious ones
- [ ] **SI prefix** (`<si>`) — `µ` → micro, 10⁻⁶; full table from yocto to yotta; also binary prefixes (kibi, mebi…)
- [ ] **Greek letters** (`<greek>`) — name ↔ symbol ↔ common usage in math/science
- [ ] **Resistor color code** (`<resistor>`) — read 4/5/6-band color sequence → resistance and tolerance value

### Numbers & mathematical curiosities

- [ ] **Collatz sequence** (`<collatz>`) — how many steps to reach 1; show the path; `27` takes 111 steps
- [ ] **Digital root** (`<digitalroot>`) — iteratively sum digits until single digit; explains casting out nines
- [ ] **Number properties** (`<numprop>`) — is it prime, perfect, abundant, deficient, happy, Armstrong, palindrome?
- [ ] **Zeckendorf representation** (`<zeckendorf>`) — any positive integer as a unique sum of non-consecutive Fibonacci numbers
- [ ] **Continued fraction** (`<cf>`) — expand any rational or famous irrational (π, e, φ) as `[a₀; a₁, a₂, …]`
- [ ] **Kaprekar routine** (`<kaprekar>`) — apply to any 4-digit number; always reaches 6174 in ≤7 steps
- [ ] **Stern-Brocot tree** (`<sternbrocot>`) — find path to any fraction in the Stern-Brocot tree

### Language & linguistics

- [ ] **IPA decoder** (`<ipa>`) — International Phonetic Alphabet symbol → description of articulation ("voiced bilabial stop")
- [ ] **Word roots** (`<root>`) — `photograph` → `photo` (Greek: light) + `graph` (Greek: write); built-in Latin/Greek root table
- [ ] **Pangram checker** (`<pangram>`) — does the text use all 26 letters? Shows missing ones
- [ ] **Palindrome checker** (`<palindrome>`) — word or phrase, ignoring spaces and punctuation
- [ ] **Rhyme scheme** (`<rhymescheme>`) — label line-ending rhymes as ABAB, AABB, etc.
- [ ] **Meter checker** (`<meter>`) — mark syllable stress, identify iambic/trochaic/anapestic/dactylic feet
- [ ] **Homophone lookup** (`<homophone>`) — `there/their/they're`, `to/too/two`; built-in table of common pairs
- [ ] **Prefix/suffix meanings** (`<affix>`) — `un-`, `re-`, `-tion`, `-ology`; built-in morpheme table
- [ ] **Spoonerism generator** (`<spoonerism>`) — swap initial consonants of adjacent words; pure string fun
- [ ] **Portmanteau builder** (`<portmanteau>`) — blend two words; suggests splice points based on phoneme overlap

### Hardware & retro computing

- [ ] **ASCII table** (`<ascii-table>`) — code → character and character → code; includes control characters with descriptions
- [ ] **Color from ANSI code** (`<ansi>`) — `\e[31m` → "red foreground"; full 256-color and truecolor support
- [ ] **Commodore BASIC errors** (`<cbmerror>`) — error number → message and common cause
- [ ] **HTTP cats / dogs** (`<httpcat>`) — status code → describes the cat/dog image meme; pure fun lookup

### Pop culture & personality

- [ ] **Chinese zodiac** (`<zodiac-cn>`) — birth year → animal, element, yin/yang, traits
- [ ] **Enneagram** (`<enneagram>`) — type number → name, core fear, core desire, wings
- [ ] **Tarot major arcana** (`<tarot-lookup>`) — card name or number → upright and reversed meanings (extends the draw skill)
- [ ] **Hogwarts Sorting** (`<hogwarts>`) — deterministic house assignment from name hash; pure fun
- [ ] **Elf name generator** (`<elfname>`) — first pet name + childhood street → classic generator formula
- [ ] **Phonetic similarity** (`<soundslike>`) — Soundex or Metaphone algorithm; does "Smith" sound like "Smyth"?
- [ ] **Name day** (`<nameday>`) — European tradition; given a first name, return the feast day (built-in table for common names)
- [ ] **Acronym builder** (`<acronym>`) — given a word, generate a plausible backronym for each letter

### Minimal external API (free, no key required)

- [ ] **Weather** (`<weather>`) — Open-Meteo (free, no auth); pairs with the Location skill for lat/lon
- [ ] **Word definition** (`<define>`) — Free Dictionary API (`api.dictionaryapi.dev`); no key, no rate limits
- [ ] **Open Library search** (`<book>`) — search Open Library by title/author; returns summary, year, cover; no key
- [ ] **Sunrise / sunset** (`<sun>`) — sunrise-sunset.org API; takes lat/lon from Location skill; no key required
- [ ] **Number trivia** (`<numtrivia>`) — numbersapi.com; `42` → "42 is the answer to life, the universe, and everything"
- [ ] **Pokédex** (`<pokemon>`) — PokéAPI (free, no auth); any Pokémon name → type, abilities, base stats, flavor text
- [ ] **ISS position** (`<iss>`) — Open Notify API; current latitude/longitude of the International Space Station
- [ ] **Dad joke** (`<dadjoke>`) — icanhazdadjoke.com; `Accept: application/json`; no key; the jokes are bad and that's the point
