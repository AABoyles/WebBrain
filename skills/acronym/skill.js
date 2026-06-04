// Word banks for each letter for backronym generation
const WORDS = {
  A:['Advanced','Autonomous','Adaptive','Agile','Artificial','Augmented','Analytical','Automated','Aligned','Accelerated'],
  B:['Better','Balanced','Brilliant','Built','Broad','Breakthrough','Bold','Boundary','Based','Behavioral'],
  C:['Collaborative','Computational','Connected','Cognitive','Creative','Critical','Comprehensive','Coordinated','Central','Core'],
  D:['Data-driven','Dynamic','Distributed','Deep','Dedicated','Decentralized','Deployable','Decisive','Discovery','Designed'],
  E:['Enhanced','Efficient','Enterprise','Elastic','Embedded','Emerging','Evidence-based','Expert','End-to-end','Evolutionary'],
  F:['Flexible','Fast','Future-ready','Functional','Federated','Fault-tolerant','Foundational','Forward','Full-stack','Framework'],
  G:['Global','Generative','Governed','Goal-oriented','Guided','Generalized','Ground-breaking','Granular','Grounded','Graph'],
  H:['High-performance','Hybrid','Hierarchical','Human-centered','Holistic','Hyper-scale','Heuristic','Horizontal','Hardened','Hands-on'],
  I:['Intelligent','Integrated','Innovative','Iterative','Interoperable','Infrastructure','Informed','Inclusive','Immersive','Insight-driven'],
  J:['Just-in-time','Joined-up','Judicious','Job-ready','Jargon-free','Journaled','Joint','Justified'],
  K:['Knowledge-driven','Key','Kernel-level','Kinetic','Known','K8s-native'],
  L:['Layered','Lean','Learning','Low-latency','Linked','Lifecycle','Language-aware','Lightweight','Logic-driven','Live'],
  M:['Machine-learning','Managed','Modular','Multi-cloud','Microservice','Metric-driven','Monitored','Meaningful','Modern','Meta'],
  N:['Next-generation','Networked','Neural','Native','Near-real-time','Node-based','Normalized','Nuanced','Non-blocking'],
  O:['Optimized','Open-source','Orchestrated','Observable','Outcome-driven','Object-oriented','On-demand','Operational','Offline-first'],
  P:['Predictive','Parallel','Platform','Privacy-preserving','Policy-driven','Pluggable','Production-ready','Persistent','Portable','Performant'],
  Q:['Query-optimized','Quality-assured','Queue-based','Quantified','Queryable'],
  R:['Resilient','Real-time','Reliable','Reactive','Robust','Role-based','Reproducible','Recursive','Regulated','Rapid'],
  S:['Scalable','Secure','Self-healing','Serverless','Streaming','Semantic','Simplified','Stateless','Supervised','Synchronized'],
  T:['Trusted','Type-safe','Telemetry-aware','Transactional','Tested','Transparent','Token-based','Thread-safe','Tenant-aware'],
  U:['Unified','Ubiquitous','User-centric','Unconstrained','Universal','Updatable','Utilization-aware'],
  V:['Versioned','Validated','Virtualized','Value-driven','Vector-based','Verifiable','Vendor-neutral'],
  W:['Well-architected','Workflow-driven','Workload-aware','Web-native','Windowed','Writeable','Wasm-compatible'],
  X:['eXtensible','eXplainable','eXpressive','eXperimental'],
  Y:['Yield-optimized','YAML-configurable'],
  Z:['Zero-downtime','Zero-trust','Zone-aware','Zoned'],
};

function randomWordFor(letter) {
  const opts = WORDS[letter.toUpperCase()];
  if (!opts) return letter.toUpperCase() + '???';
  // Deterministic-ish selection based on letter position
  return opts[0];
}

export default {
  tag: 'acronym',
  instruction: `ACRONYM BUILDER SKILL: To generate a backronym (a sentence where each letter spells out the given word), emit <acronym>WORD</acronym>.

Examples:
- "Backronym for SMART" → <acronym>SMART</acronym>
- "Make an acronym for FAST" → <acronym>FAST</acronym>`,
  call(content) {
    const word = content.trim().toUpperCase().replace(/[^A-Z]/g,'');
    if (!word) return 'Enter a word.';
    if (word.length > 20) return 'Word too long (max 20 letters).';
    const expansion = word.split('').map(c => randomWordFor(c)).join(' ');
    return `${word} = ${expansion}`;
  },
  async handle() {},
};
