// Split input into words regardless of source convention
function toWords(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')   // camelCase / PascalCase split
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_./]+/g, ' ')               // separators
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const CASES = {
  camel:   words => words[0].toLowerCase() + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
  pascal:  words => words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
  snake:   words => words.map(w => w.toLowerCase()).join('_'),
  screaming: words => words.map(w => w.toUpperCase()).join('_'),
  kebab:   words => words.map(w => w.toLowerCase()).join('-'),
  dot:     words => words.map(w => w.toLowerCase()).join('.'),
  title:   words => words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' '),
  lower:   words => words.map(w => w.toLowerCase()).join(' '),
  upper:   words => words.map(w => w.toUpperCase()).join(' '),
  slug:    words => words.map(w => w.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')).filter(Boolean).join('-'),
};

const ALIASES = {
  'camelcase': 'camel', 'camel-case': 'camel',
  'pascalcase': 'pascal', 'pascal-case': 'pascal', 'studly': 'pascal',
  'snake_case': 'snake', 'snake-case': 'snake',
  'screaming_snake': 'screaming', 'constant': 'screaming', 'upper_snake': 'screaming',
  'kebab-case': 'kebab', 'kebab_case': 'kebab', 'lisp': 'kebab', 'spinal': 'kebab',
  'dot.case': 'dot', 'dot-case': 'dot',
  'title case': 'title', 'title-case': 'title',
  'lower case': 'lower', 'lowercase': 'lower',
  'upper case': 'upper', 'uppercase': 'upper',
  'slugify': 'slug', 'url-slug': 'slug',
};

export default {
  tag: 'case',
  instruction: `CASE CONVERTER SKILL: To convert text between naming conventions, emit <case>format:text</case>.
Formats: camel, pascal, snake, screaming (SCREAMING_SNAKE), kebab, dot, title, lower, upper, slug.
Omit format to see all conversions at once.

Examples:
- "Convert 'hello world' to camelCase" → <case>camel:hello world</case>
- "All cases for 'getUserName'" → <case>getUserName</case>`,
  call(content) {
    const colon = content.indexOf(':');
    let format = null, text = content;

    if (colon > 0) {
      const candidate = content.slice(0, colon).trim().toLowerCase();
      const key = ALIASES[candidate] ?? candidate;
      if (CASES[key]) { format = key; text = content.slice(colon + 1); }
    }

    const words = toWords(text.trim());
    if (!words.length) return 'Provide text to convert.';

    if (format) return CASES[format](words);

    // Show all conversions
    return Object.entries(CASES)
      .map(([name, fn]) => `${name.padEnd(10)}: ${fn(words)}`)
      .join('\n');
  },
  async handle() {},
};
