// Atomic weights (g/mol) for all 118 elements
const AW = {
  H:1.008,He:4.003,Li:6.941,Be:9.012,B:10.811,C:12.011,N:14.007,O:15.999,F:18.998,Ne:20.180,
  Na:22.990,Mg:24.305,Al:26.982,Si:28.086,P:30.974,S:32.065,Cl:35.453,Ar:39.948,K:39.098,Ca:40.078,
  Sc:44.956,Ti:47.867,V:50.942,Cr:51.996,Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,
  Ga:69.723,Ge:72.630,As:74.922,Se:78.971,Br:79.904,Kr:83.798,Rb:85.468,Sr:87.62,Y:88.906,Zr:91.224,
  Nb:92.906,Mo:95.96,Tc:98,Ru:101.07,Rh:102.906,Pd:106.42,Ag:107.868,Cd:112.411,In:114.818,Sn:118.710,
  Sb:121.760,Te:127.60,I:126.904,Xe:131.293,Cs:132.905,Ba:137.327,La:138.905,Ce:140.116,Pr:140.908,Nd:144.242,
  Pm:145,Sm:150.36,Eu:151.964,Gd:157.25,Tb:158.925,Dy:162.500,Ho:164.930,Er:167.259,Tm:168.934,Yb:173.054,
  Lu:174.967,Hf:178.49,Ta:180.948,W:183.84,Re:186.207,Os:190.23,Ir:192.217,Pt:195.084,Au:196.967,Hg:200.59,
  Tl:204.38,Pb:207.2,Bi:208.980,Po:209,At:210,Rn:222,Fr:223,Ra:226,Ac:227,Th:232.038,Pa:231.036,U:238.029,
  Np:237,Pu:244,Am:243,Cm:247,Bk:247,Cf:251,Es:252,Fm:257,Md:258,No:259,Lr:262,Rf:267,Db:268,Sg:271,Bh:272,
  Hs:270,Mt:278,Ds:281,Rg:282,Cn:285,Nh:286,Fl:289,Mc:290,Lv:293,Ts:294,Og:294,
};

// Recursive parser: handles parentheses and subscripts
function parseFormula(formula) {
  const atoms = {};
  function parse(str, pos, multiplier) {
    while (pos < str.length) {
      const ch = str[pos];
      if (ch === '(') {
        // Find matching close paren
        let depth = 1, end = pos + 1;
        while (end < str.length && depth > 0) {
          if (str[end] === '(') depth++;
          else if (str[end] === ')') depth--;
          end++;
        }
        // Parse subscript after closing paren
        let numEnd = end;
        while (numEnd < str.length && /\d/.test(str[numEnd])) numEnd++;
        const sub = numEnd > end ? parseInt(str.slice(end, numEnd)) : 1;
        parse(str.slice(pos + 1, end - 1), 0, multiplier * sub);
        pos = numEnd;
      } else if (ch === ')') {
        break;
      } else if (/[A-Z]/.test(ch)) {
        // Element symbol: one uppercase, maybe one or two lowercase
        let symEnd = pos + 1;
        while (symEnd < str.length && /[a-z]/.test(str[symEnd])) symEnd++;
        const sym = str.slice(pos, symEnd);
        // Subscript
        let numEnd = symEnd;
        while (numEnd < str.length && /\d/.test(str[numEnd])) numEnd++;
        const count = numEnd > symEnd ? parseInt(str.slice(symEnd, numEnd)) : 1;
        atoms[sym] = (atoms[sym] ?? 0) + count * multiplier;
        pos = numEnd;
      } else {
        pos++;
      }
    }
  }
  parse(formula.replace(/\s/g, ''), 0, 1);
  return atoms;
}

export default {
  tag: 'formula',
  instruction: `CHEMICAL FORMULA SKILL: Parse a chemical formula to get molecular weight, element breakdown, and atom counts. call <|tool_call>call:formula{input:<|"|>formula<|"|>}<tool_call|>.

Examples:
- "Molecular weight of water" → <|tool_call>call:formula{input:<|"|>H2O<|"|>}<tool_call|>
- "Analyze glucose C6H12O6" → <|tool_call>call:formula{input:<|"|>C6H12O6<|"|>}<tool_call|>
- "Caffeine C8H10N4O2" → <|tool_call>call:formula{input:<|"|>C8H10N4O2<|"|>}<tool_call|>`,
  call(content) {
    const formula = content.trim();
    if (!formula) return 'Provide a chemical formula.';

    let atoms;
    try { atoms = parseFormula(formula); } catch (e) { return `Parse error: ${e.message}`; }

    const unknownElements = Object.keys(atoms).filter(sym => !AW[sym]);
    if (unknownElements.length) return `Unknown element(s): ${unknownElements.join(', ')}`;

    const totalAtoms = Object.values(atoms).reduce((s, n) => s + n, 0);
    const mw = Object.entries(atoms).reduce((s, [sym, n]) => s + AW[sym] * n, 0);

    const breakdown = Object.entries(atoms)
      .sort((a, b) => b[1] - a[1])
      .map(([sym, n]) => {
        const mass = AW[sym] * n;
        return `  ${sym}: ${n} atom${n > 1 ? 's' : ''} × ${AW[sym]} = ${mass.toFixed(3)} g/mol (${(mass / mw * 100).toFixed(1)}%)`;
      });

    return [
      `Formula: ${formula}`,
      `Molecular weight: ${mw.toFixed(3)} g/mol`,
      `Total atoms: ${totalAtoms}`,
      `Composition:`,
      ...breakdown,
    ].join('\n');
  },
  async handle() {},
};
