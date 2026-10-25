import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import { clamp } from '../lang/clamp';
import type { SettlingWindow } from './SettlingWindow';
import { TdeeEstimate } from './TdeeEstimate';
import type { TdeePrior } from './TdeePrior';
import { styleSwitchOf } from './styleSwitchOf';
import { usableIntakeDays } from './usableIntakeDays';
import type { WeightTrendPoint } from './WeightTrendPoint';

interface TdeeEstimatorInit {
  windowDays?: number;
  minSpanDays?: number;
  minIntakeDays?: number;
  minWeighIns?: number;
  partialDayFraction?: number;
  styleSwitchThreshold?: number;
  minDaysPerStyleSegment?: number;
  minBmrMultiple?: number;
  maxBmrMultiple?: number;
}

type Segment = readonly [from: CalendarDate, to: CalendarDate];

const sq = (x: number) => x * x;

/**
 * Windowed energy-balance TDEE estimator.
 *
 * TDEE = mean intake on usable days − ρ · trend slope, blended with the
 * formula prior by inverse variance. ρ is the energy density of the weight
 * change (see `energyDensityForSlope`).
 */
export class TdeeEstimator {
  readonly windowDays: number;

  /**
   * Shortest window (from the first weigh-in, or after a logging-style
   * switch) that may produce an update.
   */
  readonly minSpanDays: number;

  /** Minimum usable intake days in the window before estimating. */
  readonly minIntakeDays: number;

  /** Minimum accepted weigh-ins in the window before estimating. */
  readonly minWeighIns: number;

  /**
   * Unmarked days below this fraction of the window's 75th-percentile
   * intake are treated as partially logged and excluded. Days the user
   * marks complete (e.g. intentional fasting days) are always used.
   */
  readonly partialDayFraction: number;

  /**
   * A change in logging style (`styleChange`: weighed, by hand, or the rest)
   * larger than this between two parts of the window counts as a
   * logging-style switch.
   */
  readonly styleSwitchThreshold: number;
  readonly minDaysPerStyleSegment: number;
  readonly minBmrMultiple: number;
  readonly maxBmrMultiple: number;

  constructor(init: TdeeEstimatorInit = {}) {
    this.windowDays = init.windowDays ?? 28;
    this.minSpanDays = init.minSpanDays ?? 14;
    this.minIntakeDays = init.minIntakeDays ?? 10;
    this.minWeighIns = init.minWeighIns ?? 8;
    this.partialDayFraction = init.partialDayFraction ?? 0.65;
    this.styleSwitchThreshold = init.styleSwitchThreshold ?? 0.5;
    this.minDaysPerStyleSegment = init.minDaysPerStyleSegment ?? 7;
    this.minBmrMultiple = init.minBmrMultiple ?? 1.1;
    this.maxBmrMultiple = init.maxBmrMultiple ?? 3.0;
  }

  /**
   * Estimates TDEE as of `asOf`.
   *
   * `trend` must be a smoothed series from `WeightTrendModel.smooth` that
   * covers the window. `energyDensityForSlope` maps a weight slope
   * (kg/day) to kcal per kg of change.
   */
  estimate({
    asOf,
    intake,
    trend,
    prior,
    bmrKcal,
    energyDensityForSlope,
    settling = [],
    plannedShare,
  }: {
    asOf: CalendarDate;
    intake: Iterable<IntakeDay>;
    trend: readonly WeightTrendPoint[];
    prior: TdeePrior;
    bmrKcal: number;
    energyDensityForSlope: (slopeKgPerDay: number) => number;
    settling?: readonly SettlingWindow[];
    /**
     * The share of the flat figure planned for each day (MM-124,
     * `plannedDayShare`), so a planned lower day is not taken for a partial
     * one. Flat when not given.
     */
    plannedShare?: ((date: CalendarDate) => number) | undefined;
  }): TdeeEstimate {
    const held = ({
      usable = 0,
      partial = 0,
      weighIns = 0,
      settlingUntil,
      styleRestartOn,
    }: {
      usable?: number;
      partial?: number;
      weighIns?: number;
      settlingUntil?: CalendarDate | undefined;
      styleRestartOn?: CalendarDate | undefined;
    } = {}) =>
      new TdeeEstimate({
        kcal: prior.kcal,
        sigmaKcal: prior.sigmaKcal,
        status: 'held',
        usableIntakeDays: usable,
        excludedPartialDays: partial,
        weighIns,
        settlingUntil,
        styleRestartOn,
      });

    // The window starts no earlier than the first weigh-in, so early
    // check-ins can update from a shorter (but at least minSpanDays) window.
    let start = asOf.addDays(1 - this.windowDays);
    const firstPoint = trend[0];
    if (firstPoint !== undefined && firstPoint.date.isAfter(start)) {
      start = firstPoint.date;
    }
    let days = this.daysInWindow(intake, start, asOf);
    const switchDay = this.styleSwitch(days);
    if (switchDay !== undefined) {
      start = switchDay;
      days = days.filter((d) => !d.date.isBefore(switchDay));
    }
    if (start.daysUntil(asOf) + 1 < this.minSpanDays) {
      return held({ styleRestartOn: switchDay });
    }

    // Stretches of the window outside every settling window. Weight change
    // is summed over these only.
    const segments = this.cleanSegments(start, asOf, settling);
    const spanDays = segments.reduce((sum, [from, to]) => sum + from.daysUntil(to), 0);
    if (spanDays + 1 < this.minSpanDays) {
      // Only settling windows can have shortened the span.
      const windowEnds = settling
        .filter((w) => !w.end.isBefore(start) && !w.start.isAfter(asOf))
        .map((w) => w.end)
        .sort((a, b) => a.compareTo(b));
      return held({ settlingUntil: windowEnds[windowEnds.length - 1], styleRestartOn: switchDay });
    }
    const clean = (day: CalendarDate) => segments.some(([from, to]) => !day.isBefore(from) && !day.isAfter(to));
    days = days.filter((d) => clean(d.date));

    const [usable, partialCount] = this.usableDays(days, plannedShare);
    const trendByDay = new Map<number, WeightTrendPoint>();
    for (const p of trend) trendByDay.set(p.date.epochDay, p);
    let weighIns = 0;
    for (const [from, to] of segments) {
      for (let d = from.epochDay; d <= to.epochDay; d++) {
        if (trendByDay.get(d)?.observed ?? false) weighIns++;
      }
    }
    const found = segments.map(([from, to]) => [trendByDay.get(from.epochDay), trendByDay.get(to.epochDay)] as const);
    const ends: (readonly [WeightTrendPoint, WeightTrendPoint])[] = [];
    for (const [from, to] of found) {
      if (from !== undefined && to !== undefined) ends.push([from, to]);
    }

    if (usable.length < this.minIntakeDays || weighIns < this.minWeighIns || ends.length !== found.length) {
      return held({ usable: usable.length, partial: partialCount, weighIns });
    }

    const slope = ends.reduce((sum, [from, to]) => sum + to.levelKg - from.levelKg, 0) / spanDays;
    const slopeVariance =
      ends.reduce((sum, [from, to]) => sum + to.levelVariance + from.levelVariance, 0) / sq(spanDays);
    const rho = energyDensityForSlope(slope);

    const n = usable.length;
    const meanIntake = usable.reduce((sum, d) => sum + d.kcal, 0) / n;
    // Error in the mean: per-day measurement error, plus sampling error from
    // the window days that weren't usable (finite-population corrected).
    const measurementVar = usable.reduce((sum, d) => sum + sq(d.kcal * d.relativeSigma), 0) / sq(n);
    const sampleVar = n < 2 ? 0 : usable.reduce((sum, d) => sum + sq(d.kcal - meanIntake), 0) / (n - 1);
    const windowLength = spanDays + segments.length;
    const samplingVar = (sampleVar / n) * (1 - n / windowLength);

    const observedKcal = meanIntake - rho * slope;
    const observedVar = measurementVar + samplingVar + sq(rho) * slopeVariance;

    const priorVar = sq(prior.sigmaKcal);
    const posteriorVar = 1 / (1 / observedVar + 1 / priorVar);
    const posterior = posteriorVar * (observedKcal / observedVar + prior.kcal / priorVar);

    const lo = bmrKcal * this.minBmrMultiple;
    const hi = bmrKcal * this.maxBmrMultiple;
    const clamped = clamp(posterior, lo, hi);

    return new TdeeEstimate({
      kcal: clamped,
      sigmaKcal: Math.sqrt(posteriorVar),
      status: 'updated',
      usableIntakeDays: n,
      excludedPartialDays: partialCount,
      weighIns,
      windowStart: start,
      clampedToBounds: clamped !== posterior,
      styleRestartOn: switchDay,
    });
  }

  /** Counts days the estimator could use in an inclusive date range. */
  countUsableIntakeDays({
    intake,
    start,
    end,
  }: {
    intake: Iterable<IntakeDay>;
    start: CalendarDate;
    end: CalendarDate;
  }): number {
    return this.usableDays(this.daysInWindow(intake, start, end))[0].length;
  }

  /**
   * `start`..`end` with every settling window cut out. A piece runs from
   * the day after one window to the first day of the next, whose morning
   * weigh-in precedes the change. Pieces of a single day carry no weight
   * change and are dropped.
   */
  private cleanSegments(start: CalendarDate, end: CalendarDate, settling: readonly SettlingWindow[]): Segment[] {
    const windows = settling
      .filter((w) => !w.end.isBefore(start) && !w.start.isAfter(end))
      .sort((a, b) => a.start.compareTo(b.start));
    const segments: Segment[] = [];
    let from = start;
    for (const w of windows) {
      if (w.start.isAfter(from)) segments.push([from, w.start]);
      const next = w.end.addDays(1);
      if (next.isAfter(from)) from = next;
    }
    if (end.isAfter(from)) segments.push([from, end]);
    return segments;
  }

  private daysInWindow(intake: Iterable<IntakeDay>, start: CalendarDate, end: CalendarDate): IntakeDay[] {
    return [...intake]
      .filter((d) => !d.date.isBefore(start) && !d.date.isAfter(end))
      .sort((a, b) => a.date.compareTo(b.date));
  }

  /** Splits days into usable intake and a count of excluded partial days. */
  private usableDays(
    days: readonly IntakeDay[],
    plannedShare?: (date: CalendarDate) => number,
  ): readonly [IntakeDay[], number] {
    const usable = usableIntakeDays(days, { partialDayFraction: this.partialDayFraction, plannedShare });
    return [usable, days.length - usable.length];
  }

  /**
   * The first day of the latest logging-style regime, if the user switched
   * styles (e.g. hand portions to a food scale) inside the window.
   */
  private styleSwitch(days: readonly IntakeDay[]): CalendarDate | undefined {
    return styleSwitchOf(days, this.styleSwitchThreshold, this.minDaysPerStyleSegment);
  }
}
