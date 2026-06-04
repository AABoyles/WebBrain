let nlp = null;
async function getNlp() {
  if (!nlp) {
    const mod = await import('https://cdn.jsdelivr.net/npm/compromise@14/builds/compromise.esm.js');
    nlp = mod.default;
  }
  return nlp;
}

const TAG_LABELS = {
  Noun: 'NOUN', ProperNoun: 'PROP', Pronoun: 'PRON',
  Verb: 'VERB', Adjective: 'ADJ', Adverb: 'ADV',
  Preposition: 'PREP', Conjunction: 'CONJ', Determiner: 'DET',
  Auxiliary: 'AUX', Modal: 'MOD', Copula: 'COP',
  Negative: 'NEG', Number: 'NUM', Abbreviation: 'ABBR',
  Date: 'DATE', Time: 'TIME', Currency: 'CUR', Ordinal: 'ORD',
  Fraction: 'FRAC', Plural: 'PLU', PastTense: 'PAST', Gerund: 'GER',
  Infinitive: 'INF', Expression: 'EXPR', Punctuation: 'PUNC',
};

export default {
  tag: 'pos',
  instruction: `PART-OF-SPEECH SKILL: Tag words in a sentence with their grammatical roles, and extract named entities. Emit <pos>text</pos>.

Examples:
- "Tag 'The quick brown fox jumps'" → <pos>The quick brown fox jumps over the lazy dog</pos>
- "Find entities in text" → <pos>Apple is headquartered in Cupertino, California</pos>`,
  async call(content) {
    let n;
    try { n = await getNlp(); } catch (e) { return `Failed to load NLP library: ${e.message}`; }

    const doc = n(content);

    // Per-word tags
    const tagged = doc.terms().out('array').map((word, i) => {
      const term = doc.terms().eq(i);
      const tags = term.out('tags')[0] ?? [];
      const shortTags = (Array.isArray(tags) ? tags : Object.keys(tags))
        .filter(t => TAG_LABELS[t])
        .map(t => TAG_LABELS[t])
        .slice(0, 2);
      return `${word}/${shortTags.join('+') || '?'}`;
    });

    const lines = [`Tagged: ${tagged.join('  ')}`];

    // Named entities
    const people  = doc.people().out('array');
    const places  = doc.places().out('array');
    const orgs    = doc.organizations().out('array');
    const dates   = doc.dates().out('array');
    if (people.length)  lines.push(`People: ${people.join(', ')}`);
    if (places.length)  lines.push(`Places: ${places.join(', ')}`);
    if (orgs.length)    lines.push(`Orgs: ${orgs.join(', ')}`);
    if (dates.length)   lines.push(`Dates: ${dates.join(', ')}`);

    return lines.join('\n');
  },
  async handle() {},
};
