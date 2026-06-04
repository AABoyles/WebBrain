const GREEK = [
  {name:'alpha',   upper:'Α',lower:'α',usage:'angle; probability (stats); alpha particle; significance level'},
  {name:'beta',    upper:'Β',lower:'β',usage:'angle; beta particle; beta coefficient (finance/stats)'},
  {name:'gamma',   upper:'Γ',lower:'γ',usage:'gamma function; gamma ray; Euler–Mascheroni constant'},
  {name:'delta',   upper:'Δ',lower:'δ',usage:'change/difference (Δx); Dirac delta function; partial derivative'},
  {name:'epsilon', upper:'Ε',lower:'ε',usage:'small positive number; permittivity; Levi-Civita symbol'},
  {name:'zeta',    upper:'Ζ',lower:'ζ',usage:'Riemann zeta function; damping ratio'},
  {name:'eta',     upper:'Η',lower:'η',usage:'efficiency; viscosity; Dedekind eta function'},
  {name:'theta',   upper:'Θ',lower:'θ',usage:'angle (trigonometry); Big-Θ complexity; temperature (thermodynamics)'},
  {name:'iota',    upper:'Ι',lower:'ι',usage:'"not one iota" (meaning); rarely used technically'},
  {name:'kappa',   upper:'Κ',lower:'κ',usage:'curvature; thermal conductivity; dielectric constant'},
  {name:'lambda',  upper:'Λ',lower:'λ',usage:'wavelength; eigenvalue; lambda calculus; decay constant'},
  {name:'mu',      upper:'Μ',lower:'µ',usage:'micro- prefix (10⁻⁶); mean (statistics); coefficient of friction'},
  {name:'nu',      upper:'Ν',lower:'ν',usage:'frequency; kinematic viscosity; neutrino'},
  {name:'xi',      upper:'Ξ',lower:'ξ',usage:'random variable (advanced); Xi baryon'},
  {name:'omicron', upper:'Ο',lower:'ο',usage:'rarely used technically (looks like O)'},
  {name:'pi',      upper:'Π',lower:'π',usage:'π ≈ 3.14159…; product notation (Π); osmotic pressure'},
  {name:'rho',     upper:'Ρ',lower:'ρ',usage:'density; electrical resistivity; correlation coefficient'},
  {name:'sigma',   upper:'Σ',lower:'σ',usage:'summation (Σ); standard deviation (σ); stress; Stefan–Boltzmann constant'},
  {name:'tau',     upper:'Τ',lower:'τ',usage:'torque; time constant; τ = 2π (tau movement); shear stress'},
  {name:'upsilon', upper:'Υ',lower:'υ',usage:'rarely used technically'},
  {name:'phi',     upper:'Φ',lower:'φ',usage:'golden ratio (φ ≈ 1.618); magnetic flux (Φ); phase angle; Euler\'s totient'},
  {name:'chi',     upper:'Χ',lower:'χ',usage:'chi-squared distribution; chi-squared test; electric susceptibility'},
  {name:'psi',     upper:'Ψ',lower:'ψ',usage:'quantum wavefunction; polygamma function; parapsychology symbol'},
  {name:'omega',   upper:'Ω',lower:'ω',usage:'ohm (Ω); angular velocity (ω); Big-Ω complexity; end/last'},
];

const BY_SYMBOL = Object.fromEntries([...GREEK.flatMap(g => [[g.upper,g],[g.lower,g]])]);

export default {
  tag: 'greek',
  instruction: `GREEK LETTERS SKILL: To look up a Greek letter's symbol and uses, emit <greek>name or symbol</greek>.

Examples:
- "What is the lambda symbol?" → <greek>lambda</greek>
- "What does Σ mean?" → <greek>Σ</greek>`,
  call(content) {
    const q = content.trim();
    const g = GREEK.find(x => x.name.toLowerCase() === q.toLowerCase()) ?? BY_SYMBOL[q];
    if (!g) return `Greek letter not found: "${q}". Try "sigma", "Σ", or "λ".`;
    return [`${g.name.charAt(0).toUpperCase()+g.name.slice(1)}: ${g.upper} (upper) / ${g.lower} (lower)`,`Common uses: ${g.usage}`].join('\n');
  },
  async handle() {},
};
