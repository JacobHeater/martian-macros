import type { CalendarDate } from '../../domain/CalendarDate';
import { medianOf } from './medianOf';
import { robustSigma } from './robustSigma';
import { runEndingNear } from './runEndingNear';
import type { TrendDay } from './TrendDay';
import type { TrendDetection } from './TrendDetection';
import type { TrendDirection } from './TrendDirection';
import type { TrendPoint } from './TrendPoint';
import { TrendRule } from './TrendRule';

const mean = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

const eligibleIn = (days: readonly TrendDay[], from: CalendarDate, until: CalendarDate): TrendPoint[] =>
  days.filter((d): d is TrendPoint => d.eligible && d.value !== undefined && !d.date.isBefore(from) && !d.date.isAfter(until));

/**
 * D4b, a short run (MM-605): at least 4 eligible days, each beyond the
 * baseline's median ± 1σ the same way, ending yesterday or the day before,
 * with the run's mean at least δ from that median. The baseline is the 28
 * days before the run, with at least 14 eligible, and may reach before the
 * span. `days` runs from the lookback to yesterday, one entry per calendar
 * day, ascending; the run stays inside the span. Undefined when the
 * baseline before a 4-day run has too few days.
 */
export function detectShortRun(
  days: readonly TrendDay[],
  spanStart: CalendarDate,
  sigmaFloor: number,
  delta: number,
): TrendDetection[] | undefined {
  const rule = TrendRule.shortRun;
  const last = days[days.length - 1];
  if (last === undefined) return undefined;
  const asOf = last.date;
  const span = days.filter((d) => !d.date.isBefore(spanStart));
  const baselineBefore = (runStart: CalendarDate) => eligibleIn(days, runStart.addDays(-rule.baselineDays), runStart.addDays(-1));
  const earliest = asOf.addDays(1 - rule.minimumDays);
  if (baselineBefore(earliest).length < rule.baselineMinimum) return undefined;

  const toward = (direction: TrendDirection): TrendDetection => {
    const sign = direction === 'up' ? 1 : -1;
    let runStart = earliest;
    let baseline = baselineBefore(runStart);
    let run: ReturnType<typeof runEndingNear> = undefined;
    let center = 0;
    // The baseline is the 28 days before the run, and the run depends on the baseline: settle it in a few rounds.
    for (let round = 0; round < 3; round++) {
      if (baseline.length < rule.baselineMinimum) break;
      center = medianOf(baseline.map((p) => p.value));
      const sigma = robustSigma(baseline, sigmaFloor);
      run = runEndingNear(span, (p) => sign * (p.value - center) > rule.sigmas * sigma);
      if (run === undefined || !run.start.date.isBefore(runStart)) break;
      runStart = run.start.date;
      baseline = baselineBefore(runStart);
    }
    const length = run?.points.length ?? 0;
    const effect = run === undefined ? 0 : mean(run.points.map((p) => p.value)) - center;
    return {
      detector: 'shortRun',
      direction,
      fires: length >= rule.minimumDays && sign * effect >= delta,
      strong: length >= TrendRule.run.strongDays,
      ratio: length / rule.minimumDays,
      effect,
      n: length,
      k: length,
      days: length,
      onset: run?.start.date,
    };
  };
  return [toward('up'), toward('down')];
}
