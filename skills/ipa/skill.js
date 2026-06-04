const IPA = {
  // Plosives
  'p':  'Voiceless bilabial plosive — both lips, no voice (English "p" in "pat")',
  'b':  'Voiced bilabial plosive — both lips, voiced (English "b" in "bat")',
  't':  'Voiceless alveolar plosive — tongue to alveolar ridge, no voice ("t" in "top")',
  'd':  'Voiced alveolar plosive — tongue to alveolar ridge, voiced ("d" in "dog")',
  'k':  'Voiceless velar plosive — back of tongue to soft palate ("k" in "cat")',
  'g':  'Voiced velar plosive — back of tongue to soft palate, voiced ("g" in "go")',
  'ʔ':  'Glottal plosive — vocal folds closed then released (British "butter")',
  // Nasals
  'm':  'Voiced bilabial nasal — lips together, air through nose ("m" in "map")',
  'n':  'Voiced alveolar nasal — tongue to alveolar ridge, nasal ("n" in "not")',
  'ŋ':  'Voiced velar nasal — back of tongue to soft palate, nasal ("ng" in "sing")',
  // Fricatives
  'f':  'Voiceless labiodental fricative — upper teeth on lower lip ("f" in "fat")',
  'v':  'Voiced labiodental fricative — upper teeth on lower lip, voiced ("v" in "van")',
  'θ':  'Voiceless dental fricative — tongue between teeth ("th" in "thin")',
  'ð':  'Voiced dental fricative — tongue between teeth, voiced ("th" in "this")',
  's':  'Voiceless alveolar fricative — tongue near alveolar ridge ("s" in "sun")',
  'z':  'Voiced alveolar fricative ("z" in "zoo")',
  'ʃ':  'Voiceless postalveolar fricative ("sh" in "ship")',
  'ʒ':  'Voiced postalveolar fricative ("s" in "measure")',
  'h':  'Voiceless glottal fricative — air at glottis ("h" in "hat")',
  'x':  'Voiceless velar fricative — back of tongue to soft palate (Scottish "loch")',
  // Affricates
  'tʃ': 'Voiceless postalveolar affricate ("ch" in "church")',
  'dʒ': 'Voiced postalveolar affricate ("j" in "judge")',
  // Approximants
  'l':  'Voiced alveolar lateral approximant ("l" in "let")',
  'r':  'Voiced alveolar trill — trilled r (Spanish "perro")',
  'ɹ':  'Voiced alveolar approximant — English r ("r" in "red")',
  'j':  'Voiced palatal approximant ("y" in "yes")',
  'w':  'Voiced labio-velar approximant ("w" in "wet")',
  // Vowels
  'i':  'Close front unrounded vowel ("ee" in "see")',
  'ɪ':  'Near-close front unrounded vowel ("i" in "sit")',
  'e':  'Close-mid front unrounded vowel ("e" in "bed", in some languages)',
  'ɛ':  'Open-mid front unrounded vowel ("e" in "bed")',
  'æ':  'Near-open front unrounded vowel ("a" in "cat")',
  'a':  'Open front unrounded vowel (Spanish "a")',
  'ɑ':  'Open back unrounded vowel ("a" in "father")',
  'ɒ':  'Open back rounded vowel (British "o" in "lot")',
  'ɔ':  'Open-mid back rounded vowel ("aw" in "law")',
  'o':  'Close-mid back rounded vowel ("o" in "go", in some languages)',
  'ʊ':  'Near-close back rounded vowel ("oo" in "foot")',
  'u':  'Close back rounded vowel ("oo" in "food")',
  'ʌ':  'Open-mid back unrounded vowel ("u" in "cup")',
  'ə':  'Mid central vowel — schwa (unstressed "a" in "about")',
  'ɜ':  'Open-mid central unrounded vowel ("ur" in "bird")',
  'ɐ':  'Near-open central vowel',
  'y':  'Close front rounded vowel (French "u" in "tu")',
  'ø':  'Close-mid front rounded vowel (French "eu")',
  'œ':  'Open-mid front rounded vowel (French "coeur")',
};

export default {
  tag: 'ipa',
  instruction: `IPA DECODER SKILL: To look up what an IPA phonetic symbol represents, emit <ipa>symbol</ipa>.

Examples:
- "What is IPA ʃ?" → <ipa>ʃ</ipa>
- "Describe the sound θ" → <ipa>θ</ipa>`,
  call(content) {
    const sym = content.trim();
    const desc = IPA[sym];
    if (!desc) return `IPA symbol "${sym}" not found. The table covers common consonants and vowels.`;
    return `[${sym}]: ${desc}`;
  },
  async handle() {},
};
