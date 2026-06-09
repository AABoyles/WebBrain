function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) if (n % i === 0 || n % (i+2) === 0) return false;
  return true;
}

function isPerfect(n) {
  if (n < 2) return false;
  let sum = 1;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) { sum += i; if (i !== n/i) sum += n/i; }
  return sum === n;
}

function isHappy(n) {
  const seen = new Set();
  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = String(n).split('').reduce((s,d) => s + parseInt(d)**2, 0);
  }
  return n === 1;
}

function isArmstrong(n) {
  const digits = String(n).split('');
  return digits.reduce((s,d) => s + parseInt(d)**digits.length, 0) === n;
}

function isPalindrome(n) {
  const s = String(n);
  return s === s.split('').reverse().join('');
}

function sumDivisors(n) {
  if (n < 2) return 1;
  let sum = 1;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) { sum += i; if (i !== n/i) sum += n/i; }
  return sum;
}

export default {
  tag: 'numprop',
  instruction: `NUMBER PROPERTIES SKILL: To analyze the mathematical properties of a positive integer, call <|tool_call>call:numprop{input:<|"|>n<|"|>}<tool_call|>.

Examples:
- "Is 28 perfect?" → <|tool_call>call:numprop{input:<|"|>28<|"|>}<tool_call|>
- "Properties of 153" → <|tool_call>call:numprop{input:<|"|>153<|"|>}<tool_call|>`,
  call(content) {
    const n = parseInt(content.trim().replace(/,/g,''));
    if (isNaN(n) || n < 1) return 'Enter a positive integer.';
    if (n > 1e9) return 'Number too large (max 10⁹).';
    const sigma = sumDivisors(n);
    const props = [];
    if (isPrime(n))      props.push('Prime');
    if (n === 1)         props.push('Neither prime nor composite');
    if (isPerfect(n))    props.push('Perfect (σ(n) = 2n)');
    if (sigma > n)       props.push('Abundant (σ(n) > n)');
    if (sigma < n)       props.push('Deficient (σ(n) < n)');
    if (isHappy(n))      props.push('Happy');
    if (isArmstrong(n))  props.push('Armstrong / narcissistic');
    if (isPalindrome(n)) props.push('Palindrome');
    const sqrtN = Math.sqrt(n);
    if (Number.isInteger(sqrtN)) props.push(`Perfect square (√${n} = ${sqrtN})`);
    if (n > 0 && (n & (n-1)) === 0) props.push('Power of 2');
    return [`n = ${n}`,`Properties: ${props.length ? props.join(', ') : 'none of the tested types'}`,`Sum of divisors: ${sigma}`,`Digit sum: ${String(n).split('').reduce((a,d)=>a+parseInt(d),0)}`].join('\n');
  },
  async handle() {},
};
