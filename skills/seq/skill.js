function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) if (n % i === 0 || n % (i + 2) === 0) return false;
  return true;
}

const SEQUENCES = {
  fibonacci: (n) => { const s = [0, 1]; for (let i = 2; i < n; i++) s.push(s[i-1]+s[i-2]); return s.slice(0, n); },
  primes:    (n) => { const s = []; let i = 2; while (s.length < n) { if (isPrime(i)) s.push(i); i++; } return s; },
  triangular: (n) => Array.from({length:n}, (_,i) => (i+1)*(i+2)/2),
  square:     (n) => Array.from({length:n}, (_,i) => (i+1)**2),
  cube:       (n) => Array.from({length:n}, (_,i) => (i+1)**3),
  factorial:  (n) => { const s = [1]; for (let i = 1; i < n; i++) s.push(s[i-1]*(i+1)); return s; },
  powers2:    (n) => Array.from({length:n}, (_,i) => 2**i),
};

const ALIASES = {
  fib: 'fibonacci', fibs: 'fibonacci', fibonacci: 'fibonacci',
  prime: 'primes', primes: 'primes',
  tri: 'triangular', triangular: 'triangular',
  sq: 'square', square: 'square', squares: 'square',
  cube: 'cube', cubes: 'cube',
  fact: 'factorial', factorial: 'factorial',
  powers: 'powers2', pow2: 'powers2', powers2: 'powers2',
};

export default {
  tag: 'seq',
  instruction: `SEQUENCE SKILL: To generate terms of a mathematical sequence, emit <seq>name count</seq>.
Supported: fibonacci, primes, triangular, square, cube, factorial, powers2.

Examples:
- "First 10 Fibonacci numbers" → <seq>fibonacci 10</seq>
- "First 8 primes" → <seq>primes 8</seq>
- "First 6 factorials" → <seq>factorial 6</seq>`,
  call(content) {
    const parts = content.trim().split(/\s+/);
    const name  = ALIASES[parts[0]?.toLowerCase()];
    const count = Math.min(parseInt(parts[1] ?? '10', 10), 50);
    if (!name) return `Unknown sequence. Choose from: ${Object.keys(SEQUENCES).join(', ')}`;
    if (isNaN(count) || count < 1) return 'Count must be a positive integer (max 50).';
    return SEQUENCES[name](count).join(', ');
  },
  async handle() {},
};
