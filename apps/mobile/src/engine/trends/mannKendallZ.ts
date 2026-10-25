import type { TrendPoint } from './TrendPoint';

const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);

/**
 * The Mann–Kendall statistic of `points` (ascending by date) as a normal
 * score (MM-605, D2), with ties corrected and n shrunk for lag-1
 * autocorrelation (Hamed & Rao 1998, the first lag only): the variance of S
 * grows by 1 + 2(n − 3)ρ₁ / n, where ρ₁ is read from the residuals about
 * `slope` and only a positive ρ₁ counts. Positive is upward.
 */
export function mannKendallZ(points: readonly TrendPoint[], slope: number): number {
  const n = points.length;
  if (n < 3) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) s += sign((points[j] as TrendPoint).value - (points[i] as TrendPoint).value);
  }
  const ties = new Map<number, number>();
  for (const p of points) ties.set(p.value, (ties.get(p.value) ?? 0) + 1);
  let tieTerm = 0;
  for (const t of ties.values()) tieTerm += t * (t - 1) * (2 * t + 5);
  const variance = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;
  if (variance <= 0 || s === 0) return 0;

  const residuals = points.map((p) => p.value - slope * p.date.epochDay);
  const center = residuals.reduce((sum, r) => sum + r, 0) / n;
  let lagged = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const r = (residuals[i] as number) - center;
    total += r * r;
    if (i + 1 < n) lagged += r * ((residuals[i + 1] as number) - center);
  }
  const rho = total > 0 ? lagged / total : 0;
  const inflation = 1 + (2 * (n - 3) * Math.max(0, rho)) / n;
  return (s - sign(s)) / Math.sqrt(variance * inflation);
}
