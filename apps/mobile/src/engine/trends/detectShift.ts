import { bestSplitOf } from './bestSplitOf';
import { spreadFloorOf } from './spreadFloorOf';
import type { TrendDetection } from './TrendDetection';
import type { TrendPoint } from './TrendPoint';
import { TrendRule } from './TrendRule';

/**
 * D3, a shift (MM-605): the change point of the span's eligible days
 * (`bestSplitOf`, winsorised at ±3σ). It fires when the split's
 * statistic is at least 3.5 and the difference at least δ. The scan
 * recurses once into the days after a split that fires, and keeps the most
 * recent change that does. Undefined under 12 eligible days.
 */
export function detectShift(points: readonly TrendPoint[], sigmaFloor: number, delta: number): TrendDetection[] | undefined {
  const rule = TrendRule.shift;
  if (points.length < rule.minimumBefore + rule.minimumAfter) return undefined;
  const floor = spreadFloorOf(points, sigmaFloor);
  const values = points.map((p) => p.value);
  const passes = (split: { difference: number; t: number }) => split.t >= rule.t && Math.abs(split.difference) >= delta;

  const first = bestSplitOf(values, floor);
  if (first === undefined) return undefined;
  let found = { ...first, from: 0 };
  if (passes(first)) {
    const inner = bestSplitOf(values.slice(first.at), floor);
    if (inner !== undefined && passes(inner)) found = { ...inner, at: first.at + inner.at, from: first.at };
  }
  const fires = passes(found);
  const direction = found.difference >= 0 ? 'up' : 'down';
  const n = points.length - found.from;
  const after = points.length - found.at;
  const onset = points[found.at]?.date;
  const detection: TrendDetection = {
    detector: 'shift',
    direction,
    fires,
    strong: found.t >= rule.t * rule.strongMultiple,
    ratio: found.t / rule.t,
    effect: found.difference,
    n,
    k: after,
    days: n,
    onset,
  };
  const opposite: TrendDetection = {
    ...detection,
    direction: direction === 'up' ? 'down' : 'up',
    fires: false,
    strong: false,
    ratio: 0,
    k: 0,
  };
  return [detection, opposite];
}
