/**
 * k_crit(n) for the one-sided sign test (MM-605, D1): the fewest of `n`
 * days on one side that a fair coin (p 0.5) reaches with probability at most
 * `alpha`, from the exact binomial tail. More than `n` when no count is rare
 * enough.
 */
export function binomialCriticalCount(n: number, alpha: number): number {
  if (n <= 0) return 1;
  // The probabilities of 0..n heads, built up from 2^-n.
  const pmf: number[] = [Math.pow(0.5, n)];
  for (let i = 0; i < n; i++) pmf.push(((pmf[i] as number) * (n - i)) / (i + 1));
  let tail = 0;
  let k = n + 1;
  for (let i = n; i >= 0; i--) {
    tail += pmf[i] as number;
    if (tail > alpha * (1 + 1e-12)) break;
    k = i;
  }
  return k;
}
