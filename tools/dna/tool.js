const DNA_COMP = { A:'T', T:'A', C:'G', G:'C', a:'t', t:'a', c:'g', g:'c' };
const DNA_RNA  = { A:'A', T:'U', C:'C', G:'G', a:'a', t:'u', c:'c', g:'g' };
const RNA_DNA  = { A:'A', U:'T', C:'C', G:'G', a:'a', u:'t', c:'c', g:'g' };

const CODONS = {
  UUU:'Phe(F)',UUC:'Phe(F)',UUA:'Leu(L)',UUG:'Leu(L)',
  CUU:'Leu(L)',CUC:'Leu(L)',CUA:'Leu(L)',CUG:'Leu(L)',
  AUU:'Ile(I)',AUC:'Ile(I)',AUA:'Ile(I)',AUG:'Met(M)',
  GUU:'Val(V)',GUC:'Val(V)',GUA:'Val(V)',GUG:'Val(V)',
  UCU:'Ser(S)',UCC:'Ser(S)',UCA:'Ser(S)',UCG:'Ser(S)',
  CCU:'Pro(P)',CCC:'Pro(P)',CCA:'Pro(P)',CCG:'Pro(P)',
  ACU:'Thr(T)',ACC:'Thr(T)',ACA:'Thr(T)',ACG:'Thr(T)',
  GCU:'Ala(A)',GCC:'Ala(A)',GCA:'Ala(A)',GCG:'Ala(A)',
  UAU:'Tyr(Y)',UAC:'Tyr(Y)',UAA:'Stop(*)',UAG:'Stop(*)',
  CAU:'His(H)',CAC:'His(H)',CAA:'Gln(Q)',CAG:'Gln(Q)',
  AAU:'Asn(N)',AAC:'Asn(N)',AAA:'Lys(K)',AAG:'Lys(K)',
  GAU:'Asp(D)',GAC:'Asp(D)',GAA:'Glu(E)',GAG:'Glu(E)',
  UGU:'Cys(C)',UGC:'Cys(C)',UGA:'Stop(*)',UGG:'Trp(W)',
  CGU:'Arg(R)',CGC:'Arg(R)',CGA:'Arg(R)',CGG:'Arg(R)',
  AGU:'Ser(S)',AGC:'Ser(S)',AGA:'Arg(R)',AGG:'Arg(R)',
  GGU:'Gly(G)',GGC:'Gly(G)',GGA:'Gly(G)',GGG:'Gly(G)',
};

function clean(seq) { return seq.toUpperCase().replace(/[^ACGTU\n]/g, ''); }

function complement(seq) {
  return seq.split('').map(b => DNA_COMP[b] ?? b).join('');
}

function transcribe(dna) {
  return dna.toUpperCase().split('').map(b => DNA_RNA[b.toUpperCase()] ?? b).join('');
}

function revTranscribe(rna) {
  return rna.toUpperCase().split('').map(b => RNA_DNA[b] ?? b).join('');
}

function translate(rna) {
  rna = rna.toUpperCase().replace(/T/g, 'U');
  const codons = rna.match(/.{1,3}/g) ?? [];
  const aas = [];
  for (const codon of codons) {
    if (codon.length < 3) break;
    const aa = CODONS[codon];
    if (!aa) { aas.push('?'); continue; }
    aas.push(aa);
    if (aa.includes('Stop')) break;
  }
  return aas.join(' — ');
}

// Parse FASTA format: returns array of {id, desc, seq}
function parseFasta(text) {
  const records = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('>')) {
      if (cur) records.push(cur);
      const space = t.indexOf(' ');
      cur = { id: space > 0 ? t.slice(1, space) : t.slice(1), desc: space > 0 ? t.slice(space + 1) : '', seq: '' };
    } else if (cur) {
      cur.seq += t.replace(/[^A-Za-z]/g, '');
    }
  }
  if (cur) records.push(cur);
  return records;
}

export default {
  tag: 'dna',
  instruction: `DNA/RNA SKILL: Perform DNA/RNA operations. call <|tool_call>call:dna{input:<|"|>op:sequence<|"|>}<tool_call|>.
Operations: complement, revcomp, transcribe (DNA→mRNA), revtranscribe (mRNA→DNA), translate (RNA/DNA→protein), fasta (parse FASTA format), gc (GC content).

Examples:
- "Complement of ATCG" → <|tool_call>call:dna{input:<|"|>complement:ATCG<|"|>}<tool_call|>
- "Transcribe ATGCTA" → <|tool_call>call:dna{input:<|"|>transcribe:ATGCTA<|"|>}<tool_call|>
- "Translate AUG UUU UAA" → <|tool_call>call:dna{input:<|"|>translate:AUGUUUUAA<|"|>}<tool_call|>
- "GC content of ATGCATGC" → <|tool_call>call:dna{input:<|"|>gc:ATGCATGC<|"|>}<tool_call|>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon === -1) return 'Format: op:sequence — ops: complement, revcomp, transcribe, revtranscribe, translate, gc, fasta';
    const op  = content.slice(0, colon).trim().toLowerCase();
    const seq = content.slice(colon + 1).trim();

    if (op === 'fasta') {
      const records = parseFasta(seq);
      if (!records.length) return 'No FASTA records found.';
      return records.map(r => {
        const label = r.desc ? `${r.id} — ${r.desc}` : r.id;
        return `>${label}\n  Length: ${r.seq.length} bp\n  Sequence: ${r.seq.slice(0, 60)}${r.seq.length > 60 ? '…' : ''}`;
      }).join('\n');
    }

    const s = seq.toUpperCase().replace(/\s/g, '');
    if (!s) return 'Provide a sequence.';

    switch (op) {
      case 'complement':    return complement(s);
      case 'revcomp':       return complement(s).split('').reverse().join('');
      case 'transcribe':    return transcribe(s);
      case 'revtranscribe': return revTranscribe(s);
      case 'translate': {
        const result = translate(s);
        return result || 'Could not translate (need RNA/DNA sequence).';
      }
      case 'gc': {
        const gc = (s.match(/[GC]/g) ?? []).length;
        return `GC content: ${gc}/${s.length} = ${(gc / s.length * 100).toFixed(1)}%`;
      }
      default: return `Unknown operation "${op}". Try: complement, revcomp, transcribe, revtranscribe, translate, gc, fasta`;
    }
  },
  async handle() {},
};
