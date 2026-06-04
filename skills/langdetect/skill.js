// Language detection via character n-gram frequency profiles
// Each language profile is a ranked list of the most distinctive trigrams.
// Score = count of shared trigrams between text and profile (rank-weighted).

const PROFILES = {
  eng: { name:'English',      trigrams:'the and ing ion tio ent for ati her hat thi ere ter tha ate nth her eth re' },
  spa: { name:'Spanish',      trigrams:'que de la el los con ent ion est ado las res aci par una nte ero del' },
  fra: { name:'French',       trigrams:'les que des ent ion est pas les ait une tion pour ans ont ous ait ait' },
  por: { name:'Portuguese',   trigrams:'que ent ion est ade ção uma com dos mos ser ras para ais nos' },
  ita: { name:'Italian',      trigrams:'che del ent ion est ell una per gli zione one lla con ione ere ome' },
  deu: { name:'German',       trigrams:'die der und das ein cht den ist ung sch eit ier eit gen auf ein' },
  nld: { name:'Dutch',        trigrams:'een van het der eer ien ste oor den ijk cht aar aan sch ing ove' },
  swe: { name:'Swedish',      trigrams:'att det och som inte den ett för har ska alla är med sig' },
  nor: { name:'Norwegian',    trigrams:'det er og til har som ikke av den men kan vil ett for på' },
  dan: { name:'Danish',       trigrams:'det er og til har som ikke den kan vel ett for på at en' },
  pol: { name:'Polish',       trigrams:'nie jak jest że sie jego jej ich ale też tam ten ale jestem' },
  rus: { name:'Russian',      trigrams:'ого его что ние это ных для ений ной ент ана ств ест ени ото' },
  zho: { name:'Chinese',      trigrams:'的 了 在 是 我 有 和 人 这 中 大 为 上 个 国 他' },
  jpn: { name:'Japanese',     trigrams:'の は を に が で と も て し' },
  kor: { name:'Korean',       trigrams:'이 는 을 에 의 가 을 도 하 한' },
  ara: { name:'Arabic',       trigrams:'ال من على في لا ما هذا كان إلى' },
  hin: { name:'Hindi',        trigrams:'है में और के की का एक को भी' },
  tur: { name:'Turkish',      trigrams:'bir bu lar nin den bir ile lar için dır bir' },
  vie: { name:'Vietnamese',   trigrams:'của các một có và được những trong đó' },
  tha: { name:'Thai',         trigrams:'ที่ ใน ของ เป็น และ มา จาก ได้ ให้ แต่' },
  ind: { name:'Indonesian',   trigrams:'yang dan ini itu dengan tidak ada akan juga dari' },
  ukr: { name:'Ukrainian',    trigrams:'що але всі яка або про був вони його від так' },
  ces: { name:'Czech',        trigrams:'pro ale jsou jedn pak kdy kde byl jak neb' },
  ron: { name:'Romanian',     trigrams:'că şi din est are sau are unui lui' },
  fin: { name:'Finnish',      trigrams:'ssa lla on ei ole nen en lla ssa' },
};

function trigrams(text) {
  const clean = text.toLowerCase().replace(/\s+/g, ' ').slice(0, 1000);
  const tg = {};
  for (let i = 0; i < clean.length - 2; i++) {
    const t = clean.slice(i, i + 3);
    tg[t] = (tg[t] ?? 0) + 1;
  }
  return tg;
}

function score(textTg, profileTrigrams) {
  let s = 0;
  const tgs = profileTrigrams.trim().split(/\s+/);
  const ranked = Object.fromEntries(tgs.map((t, i) => [t, tgs.length - i]));
  for (const [tg, count] of Object.entries(textTg)) {
    if (ranked[tg]) s += ranked[tg] * count;
  }
  return s;
}

// Heuristic: detect script for CJK/Arabic/Hebrew/Cyrillic/Thai/Devanagari
function detectScript(text) {
  const counts = {
    cjk:   (text.match(/[一-鿿぀-ヿ]/g) ?? []).length,
    arabic:(text.match(/[؀-ۿ]/g) ?? []).length,
    cyril: (text.match(/[Ѐ-ӿ]/g) ?? []).length,
    devan: (text.match(/[ऀ-ॿ]/g) ?? []).length,
    thai:  (text.match(/[฀-๿]/g) ?? []).length,
    korean:(text.match(/[가-힯]/g) ?? []).length,
  };
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (dominant[1] < 5) return null;
  return dominant[0];
}

export default {
  tag: 'langdetect',
  instruction: `LANGUAGE DETECTION SKILL: Identify the language of a text. Emit <langdetect>text</langdetect>.

Examples:
- "What language is 'Bonjour le monde'?" → <langdetect>Bonjour le monde</langdetect>
- "Detect language of 'Hola mundo'" → <langdetect>Hola mundo</langdetect>`,
  call(content) {
    if (!content.trim()) return 'Provide text to analyze.';
    if (content.trim().length < 5) return 'Text too short for reliable detection.';

    // Script-based fast path for non-Latin scripts
    const script = detectScript(content);
    if (script === 'korean') return 'Korean (kor)\nScript: Hangul';
    if (script === 'thai')   return 'Thai (tha)\nScript: Thai';
    if (script === 'devan')  return 'Hindi (hin)\nScript: Devanagari';

    const textTg = trigrams(content);
    const scores = Object.entries(PROFILES)
      .map(([code, { name }]) => ({ code, name, score: score(textTg, PROFILES[code].trigrams) }))
      .sort((a, b) => b.score - a.score);

    const top = scores.slice(0, 3);
    const best = top[0];
    if (best.score === 0) return 'Could not detect language (try more text).';

    const ratio = top[1].score > 0 ? top[1].score / best.score : 0;
    const conf  = ratio < 0.5 ? 'high' : ratio < 0.8 ? 'medium' : 'low';
    const lines = [`Detected: ${best.name} (${best.code})  [${conf} confidence]`];
    if (top[1].score > 0) lines.push(`Runner-up: ${top[1].name} (${top[1].code})`);
    return lines.join('\n');
  },
  async handle() {},
};
