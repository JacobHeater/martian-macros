import type { CalendarDate } from '../../domain/CalendarDate';
import { detectDrift } from './detectDrift';
import { detectLevelAgainstTarget } from './detectLevelAgainstTarget';
import { detectLongRun } from './detectLongRun';
import { detectRecentAgainstBaseline } from './detectRecentAgainstBaseline';
import { detectShift } from './detectShift';
import { detectShortRun } from './detectShortRun';
import { detectUnloggedWeekday } from './detectUnloggedWeekday';
import { detectWeekday } from './detectWeekday';
import { detectWeekend } from './detectWeekend';
import { robustSigma } from './robustSigma';
import { roundedEffect } from './roundedEffect';
import type { TrendAspect } from './TrendAspect';
import type { TrendBoundary } from './TrendBoundary';
import type { TrendDay } from './TrendDay';
import type { TrendDetection } from './TrendDetection';
import { TrendDetector } from './TrendDetector';
import type { TrendDirection } from './TrendDirection';
import type { TrendEvaluation } from './TrendEvaluation';
import type { TrendFinding } from './TrendFinding';
import type { TrendPoint } from './TrendPoint';
import type { TrendReading } from './TrendReading';
import { TrendRule } from './TrendRule';
import type { TrendSignal } from './TrendSignal';
import type { TrendSpan } from './TrendSpan';
import { TrendTier } from './TrendTier';
import { trendKeyOf } from './trendKeyOf';
import { weekBlocksOf } from './weekBlocksOf';

const isPoint = (day: TrendDay): day is TrendPoint => day.eligible;

const later = (a: CalendarDate, b: CalendarDate) => (b.isAfter(a) ? b : a);

const toward = (effect: number, direction: TrendDirection) => (direction === 'up' ? effect : -effect);

/**
 * Evaluates one signal over one span ending on `asOf`, which is yesterday
 * (MM-605): the span's eligible days, the current regime, every detector
 * that applies and that the span can feed, and one reading per key. Pure:
 * no day after `asOf` is read, and nothing is stored.
 *
 * - **Coverage.** Under 60% eligible, every key is held. From 60% to 80%
 *   the strength drops a tier and the sentence says "on the days you
 *   logged". More than a third of eligible days estimate-heavy drops a
 *   tier; more than half withholds the size.
 * - **Regime.** State claims (D1, D2, D5) read from the latest of the
 *   span's start, a forced boundary in `boundaries`, and a shift that D3
 *   finds. Event claims (D3, D4, D6) report the most recent change in the
 *   span, with baselines up to 28 days before it.
 * - **Logging style.** An event within 3 days of a `loggingStyle` boundary
 *   is data quality: it moves to the `loggingStyle` key, out of the level.
 *   The baselines of D4b and D6 never reach back across a switch.
 * - **Rounding.** An effect that rounds below δ is not a finding, and no
 *   effect is a signed zero.
 */
export function evaluateSignal<Input>(
  signal: TrendSignal<Input>,
  input: Input,
  asOf: CalendarDate,
  span: TrendSpan,
  boundaries: readonly TrendBoundary[] = [],
): TrendEvaluation {
  const { delta, sigmaFloor, roundTo } = signal;
  const spanStart = asOf.addDays(1 - span);
  const lookStart = spanStart.addDays(-TrendRule.baselineLookbackDays);

  const known = new Map<number, TrendDay>();
  // The first logged day of the whole series: a day before it is not a gap (D5's unlogged weekday, MM-614).
  let firstLogged: CalendarDate | undefined;
  for (const day of signal.series(input)) {
    const logged = day.value !== undefined && day.reason !== 'unlogged';
    if (logged && !day.date.isAfter(asOf) && (firstLogged === undefined || day.date.isBefore(firstLogged))) {
      firstLogged = day.date;
    }
    if (day.date.isBefore(lookStart) || day.date.isAfter(asOf)) continue;
    const extra = day.eligible ? signal.eligibility?.(day, input) : undefined;
    const usable = day.eligible && extra === undefined && day.value !== undefined && Number.isFinite(day.value);
    const reason = day.eligible ? extra : day.reason;
    known.set(
      day.date.epochDay,
      usable ? day : { ...day, eligible: false, reason: reason ?? (day.value === undefined ? 'unlogged' : 'excluded') },
    );
  }
  const days: TrendDay[] = [];
  for (let date = lookStart; !date.isAfter(asOf); date = date.addDays(1)) {
    days.push(known.get(date.epochDay) ?? { date, value: undefined, eligible: false, reason: 'unlogged' });
  }
  const spanDays = days.slice(days.length - span);
  const spanPoints = spanDays.filter(isPoint);
  const allPoints = days.filter(isPoint);
  const coverage = spanPoints.length / span;
  const estimateHeavy = spanPoints.filter((p) => (p.estimatedShare ?? 0) > TrendRule.estimatedDayShare).length;
  const estimateHeavyShare = spanPoints.length === 0 ? 0 : estimateHeavy / spanPoints.length;
  const recentFrom = asOf.addDays(1 - TrendRule.heldRecentDays);
  const recentEligible = spanPoints.filter((p) => !p.date.isBefore(recentFrom)).length;
  const plannedDays = spanPoints.filter((p) => p.planned === true).length;

  const aspects: TrendAspect[] = [...new Set<TrendAspect>(signal.aspects.filter((a) => a !== 'loggingStyle'))];
  if (aspects.includes('level')) aspects.push('loggingStyle');

  let regimeStart = spanStart;
  for (const boundary of boundaries) {
    if (boundary.date.isAfter(spanStart) && !boundary.date.isAfter(asOf)) regimeStart = later(regimeStart, boundary.date);
  }

  const held = (aspect: TrendAspect): TrendReading => ({
    key: trendKeyOf(signal.id, aspect),
    signal: signal.id,
    aspect,
    asOf,
    status: 'held',
    finding: undefined,
    exited: { up: false, down: false },
  });
  if (coverage < TrendRule.coverageMinimum) {
    return { signal: signal.id, asOf, span, coverage, eligibleDays: spanPoints.length, estimateHeavyShare, regimeStart, readings: aspects.map(held), findings: [] };
  }

  const shown = (d: TrendDetection) => d.detector === 'unloggedWeekday' || Math.abs(roundedEffect(d.effect, roundTo)) >= delta;
  const applies = (detector: TrendDetector) =>
    signal.detectors.includes(detector) &&
    signal.aspects.includes(TrendDetector.aspect(detector)) &&
    span >= TrendRule.minimumSpanDays[detector];
  const detections = new Map<TrendDetector, readonly TrendDetection[]>();
  const record = (detector: TrendDetector, found: readonly TrendDetection[] | undefined) => {
    if (found !== undefined) detections.set(detector, found);
  };

  if (applies('shift')) {
    const shift = detectShift(spanPoints, sigmaFloor, delta);
    record('shift', shift);
    const change = shift?.find((d) => d.fires && shown(d))?.onset;
    if (change !== undefined) regimeStart = later(regimeStart, change);
  }
  const regimePoints = spanPoints.filter((p) => !p.date.isBefore(regimeStart));
  // A baseline never reaches across a logging-style switch: the change there is data quality, which D3 reports.
  const switches = boundaries.filter((b) => b.cause === 'loggingStyle' && !b.date.isAfter(asOf)).map((b) => b.date);
  const lastSwitch = switches.reduce<CalendarDate | undefined>((a, b) => (a === undefined ? b : later(a, b)), undefined);
  const sinceSwitch = (day: TrendDay) => lastSwitch === undefined || !day.date.isBefore(lastSwitch);
  if (applies('levelAgainstTarget')) record('levelAgainstTarget', detectLevelAgainstTarget(regimePoints, delta));
  if (applies('drift')) record('drift', detectDrift(regimePoints, regimeStart, asOf, delta));
  if (applies('longRun')) record('longRun', detectLongRun(spanDays, delta));
  if (applies('shortRun')) record('shortRun', detectShortRun(days.filter(sinceSwitch), spanStart, sigmaFloor, delta));
  if (applies('recentAgainstBaseline')) {
    record('recentAgainstBaseline', detectRecentAgainstBaseline(allPoints.filter(sinceSwitch), asOf, sigmaFloor, delta));
  }
  if (applies('weekend') || applies('weekday') || applies('unloggedWeekday')) {
    const windowStart = later(asOf.addDays(1 - Math.min(TrendRule.weekday.windowDays, span)), regimeStart);
    const blocks = weekBlocksOf(days, windowStart, asOf);
    if (blocks.length >= TrendRule.weekday.minimumWeeks) {
      if (applies('weekend')) record('weekend', detectWeekend(blocks, delta));
      if (applies('weekday')) record('weekday', detectWeekday(blocks, delta, robustSigma(blocks.flat().filter(isPoint), sigmaFloor)));
      if (applies('unloggedWeekday')) record('unloggedWeekday', detectUnloggedWeekday(blocks, firstLogged));
    }
  }

  const onSwitch = (d: TrendDetection) => {
    const onset = d.onset;
    if (!d.fires || !TrendDetector.isEvent(d.detector) || onset === undefined) return false;
    const near = TrendRule.styleSwitchDays;
    return switches.some((s) => !s.isBefore(onset.addDays(-near)) && !s.isAfter(onset.addDays(near)));
  };
  const aspectOf = (d: TrendDetection): TrendAspect => (onSwitch(d) ? 'loggingStyle' : TrendDetector.aspect(d.detector));
  const everything = [...detections.values()].flat();

  const tierOf = (d: TrendDetection) => {
    let rank = d.strong && d.days >= TrendRule.strongMinimumDays ? 2 : 1;
    if (coverage < TrendRule.coverageFull) rank -= 1;
    if (estimateHeavyShare > TrendRule.estimateHeavyDropShare) rank -= 1;
    return TrendTier.values[Math.max(0, rank)] as TrendTier;
  };
  const findingOf = (d: TrendDetection, aspect: TrendAspect): TrendFinding => {
    const weeks = d.detector === 'unloggedWeekday';
    return {
      key: trendKeyOf(signal.id, aspect),
      signal: signal.id,
      aspect,
      detector: d.detector,
      direction: d.direction,
      tier: tierOf(d),
      effect: weeks ? d.effect : roundedEffect(d.effect, roundTo),
      unit: weeks ? 'weeks' : signal.unit,
      delta,
      n: d.n,
      k: d.k,
      span,
      asOf,
      onsetDate: d.onset,
      coverage,
      onLoggedDays: coverage < TrendRule.coverageFull,
      sizeWithheld: estimateHeavyShare > TrendRule.estimateHeavyWithholdShare,
      settled: d.detector === 'shift' && d.onset !== undefined && d.onset.daysUntil(asOf) >= TrendRule.shift.settledDays,
      weekday: d.weekday,
      plannedDays,
      priority: aspect === 'loggingStyle' ? 'dataQuality' : signal.priority,
      actionable: signal.actionable,
      order: signal.order,
      family: signal.family,
      goodDirection: signal.goodDirection,
      supporting: [],
    };
  };

  const readings = aspects.map((aspect): TrendReading => {
    const ran = [...detections.keys()].some((detector) => TrendDetector.aspect(detector) === (aspect === 'loggingStyle' ? 'level' : aspect));
    if (!ran || recentEligible < TrendRule.heldRecentMinimum) return held(aspect);
    const own = everything.filter((d) => aspectOf(d) === aspect);
    const firing = own
      .filter((d) => d.fires && shown(d))
      .sort((a, b) => TrendDetector.precedence(a.detector) - TrendDetector.precedence(b.detector) || b.ratio - a.ratio)
      .map((d) => findingOf(d, aspect));
    const top = firing[0];
    const finding = top === undefined ? undefined : { ...top, supporting: firing.slice(1) };
    const exits = (direction: TrendDirection) =>
      !own.some(
        (d) =>
          d.direction === direction &&
          d.ratio >= TrendRule.exitShare &&
          (d.detector === 'unloggedWeekday' || toward(d.effect, direction) >= delta * TrendRule.exitEffectShare),
      );
    return {
      key: trendKeyOf(signal.id, aspect),
      signal: signal.id,
      aspect,
      asOf,
      status: finding !== undefined && finding.tier !== 'silent' ? 'detected' : 'quiet',
      finding,
      exited: { up: exits('up'), down: exits('down') },
    };
  });

  return {
    signal: signal.id,
    asOf,
    span,
    coverage,
    eligibleDays: spanPoints.length,
    estimateHeavyShare,
    regimeStart,
    readings,
    findings: readings.flatMap((r) => (r.status === 'detected' && r.finding !== undefined ? [r.finding] : [])),
  };
}
