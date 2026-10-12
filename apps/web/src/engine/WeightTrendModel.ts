import { CalendarDate } from '../domain/CalendarDate';
import type { WeightObservation } from '../domain/WeightObservation';
import type { Gaussian } from './Gaussian';
import { Mat } from './Mat';
import type { TrendShift } from './TrendShift';
import { WeightTrendPoint } from './WeightTrendPoint';

interface WeightTrendModelInit {
  relativeWaterSigma?: number;
  waterPersistence?: number;
  relativeScaleSigma?: number;
  levelProcessSigmaKg?: number;
  slopeProcessSigmaKgPerDay?: number;
  initialSlopeSigmaKgPerDay?: number;
  outlierSigmas?: number;
  maxConsecutiveRejections?: number;
}

const sq = (x: number) => x * x;

/**
 * Kalman filter + Rauch-Tung-Striebel smoother over (level, slope, water).
 *
 * A weigh-in is `level + water + noise`. Water is an AR(1) process: a salty
 * meal or a hard leg day raises it for a few days, then it decays. Modelling
 * it explicitly stops multi-day water swings being read as tissue change
 * and keeps the reported uncertainty honest. Noise scales with body weight.
 */
export class WeightTrendModel {
  /** Stationary one-sigma water fluctuation as a fraction of body weight. */
  readonly relativeWaterSigma: number;

  /** Day-to-day autocorrelation of the water offset (0 = independent). */
  readonly waterPersistence: number;

  /** One-sigma independent reading noise (scale, clothing, timing). */
  readonly relativeScaleSigma: number;

  readonly levelProcessSigmaKg: number;
  readonly slopeProcessSigmaKgPerDay: number;
  readonly initialSlopeSigmaKgPerDay: number;

  /** Innovations beyond this many sigmas are rejected as outliers. */
  readonly outlierSigmas: number;

  /**
   * After this many rejections in a row the next reading is accepted
   * anyway: a real step change (e.g. after a long gap) must not be locked
   * out forever.
   */
  readonly maxConsecutiveRejections: number;

  constructor(init: WeightTrendModelInit = {}) {
    this.relativeWaterSigma = init.relativeWaterSigma ?? 0.006;
    this.waterPersistence = init.waterPersistence ?? 0.65;
    this.relativeScaleSigma = init.relativeScaleSigma ?? 0.002;
    this.levelProcessSigmaKg = init.levelProcessSigmaKg ?? 0.02;
    this.slopeProcessSigmaKgPerDay = init.slopeProcessSigmaKgPerDay ?? 0.003;
    this.initialSlopeSigmaKgPerDay = init.initialSlopeSigmaKgPerDay ?? 0.1;
    this.outlierSigmas = init.outlierSigmas ?? 5;
    this.maxConsecutiveRejections = init.maxConsecutiveRejections ?? 3;
  }

  /**
   * Returns one point per calendar day from the first weigh-in through
   * `through` (default: the last weigh-in). Empty if there are none.
   *
   * When several observations share a day the first is used; ingestion is
   * responsible for choosing the day's canonical reading. `noiseMultiplier`
   * marks days with extra transient water (e.g. `cycleNoiseMultiplier`).
   */
  smooth(
    observations: Iterable<WeightObservation>,
    {
      through,
      noiseMultiplier,
      shift,
    }: {
      through?: CalendarDate | undefined;
      noiseMultiplier?: ((date: CalendarDate) => number) | undefined;
      shift?: ((date: CalendarDate) => TrendShift | undefined) | undefined;
    } = {},
  ): WeightTrendPoint[] {
    const byDay = new Map<number, number>();
    for (const o of observations) {
      if (!byDay.has(o.date.epochDay)) byDay.set(o.date.epochDay, o.weightKg);
    }
    if (byDay.size === 0) return [];

    const days = [...byDay.keys()].sort((x, y) => x - y);
    const first = days[0] as number;
    const last = through?.epochDay ?? (days[days.length - 1] as number);
    if (last < first) return [];

    const reference = byDay.get(first) as number;
    const waterVar = sq(this.relativeWaterSigma * reference);
    const phi = this.waterPersistence;
    const f = Mat.of(3, [1, 1, 0, 0, 1, 0, 0, 0, phi]);
    const q = Mat.diagonal([
      sq(this.levelProcessSigmaKg),
      sq(this.slopeProcessSigmaKgPerDay),
      waterVar * (1 - phi * phi),
    ]);

    const filtered: Gaussian[] = [];
    const predicted: Gaussian[] = [];
    const observed: boolean[] = [];
    const rejected: boolean[] = [];
    let rejectionsInARow = 0;

    for (let day = first; day <= last; day++) {
      const date = CalendarDate.fromEpochDay(day);
      const z = byDay.get(day);

      let prior: Gaussian;
      const previous = filtered[filtered.length - 1];
      if (previous === undefined) {
        // First reading: level = z − water − noise, so level and water start
        // perfectly anti-correlated. The first day always has a reading.
        const z0 = z as number;
        const r = this.readingVariance(z0, date, waterVar, noiseMultiplier);
        prior = {
          mean: [z0, 0, 0],
          cov: Mat.of(3, [
            waterVar + r,
            0,
            -waterVar,
            0,
            sq(this.initialSlopeSigmaKgPerDay),
            0,
            -waterVar,
            0,
            waterVar,
          ]),
        };
      } else {
        // A day that may carry a shift lets level and slope move freely,
        // so a step is not smeared into the slope and a change of pace is
        // not resisted for weeks.
        const extra = shift?.(date);
        const qDay =
          extra === undefined
            ? q
            : q.add(Mat.diagonal([sq(extra.levelSigmaKg), sq(extra.slopeSigmaKgPerDay), 0]));
        const mean = f.apply(previous.mean);
        if (extra !== undefined) mean[0] = (mean[0] as number) + extra.levelMeanKg;
        prior = { mean, cov: f.mul(previous.cov).mul(f.t()).add(qDay) };
      }
      predicted.push(prior);

      let state = prior;
      let used = false;
      let outlier = false;
      if (z !== undefined) {
        const r = this.readingVariance(z, date, waterVar, noiseMultiplier);
        // H = [1, 0, 1]
        const m = prior.mean as readonly [number, number, number];
        const p = prior.cov;
        const innovation = z - (m[0] + m[2]);
        const ph = [0, 1, 2].map((i) => p.at(i, 0) + p.at(i, 2)) as [number, number, number];
        const s = ph[0] + ph[2] + r;
        const isOutlier =
          previous !== undefined &&
          Math.abs(innovation) > this.outlierSigmas * Math.sqrt(s) &&
          rejectionsInARow < this.maxConsecutiveRejections;
        if (isOutlier) {
          outlier = true;
          rejectionsInARow++;
        } else {
          rejectionsInARow = 0;
          used = true;
          const k = ph.map((v) => v / s);
          state = {
            mean: m.map((value, i) => value + (k[i] as number) * innovation),
            cov: Mat.generate(3, (i, j) => p.at(i, j) - (k[i] as number) * (ph[j] as number)),
          };
        }
      }
      filtered.push(state);
      observed.push(used);
      rejected.push(outlier);
    }

    const smoothed = [...filtered];
    for (let t = smoothed.length - 2; t >= 0; t--) {
      const fil = filtered[t] as Gaussian;
      const next = predicted[t + 1] as Gaussian;
      const after = smoothed[t + 1] as Gaussian;
      const c = fil.cov.mul(f.t()).mul(next.cov.inverse());
      const dMean = [0, 1, 2].map((i) => (after.mean[i] as number) - (next.mean[i] as number));
      const correction = c.apply(dMean);
      smoothed[t] = {
        mean: [0, 1, 2].map((i) => (fil.mean[i] as number) + (correction[i] as number)),
        cov: fil.cov.add(c.mul(after.cov.sub(next.cov)).mul(c.t())),
      };
    }

    return smoothed.map(
      (g, i) =>
        new WeightTrendPoint({
          date: CalendarDate.fromEpochDay(first + i),
          levelKg: g.mean[0] as number,
          slopeKgPerDay: g.mean[1] as number,
          waterKg: g.mean[2] as number,
          levelVariance: g.cov.at(0, 0),
          slopeVariance: g.cov.at(1, 1),
          observed: observed[i] as boolean,
          rejected: rejected[i] as boolean,
        }),
    );
  }

  /**
   * Independent variance of one reading. On widened days the extra
   * transient water is added as reading noise rather than tissue signal.
   */
  private readingVariance(
    weightKg: number,
    date: CalendarDate,
    waterVar: number,
    noiseMultiplier: ((date: CalendarDate) => number) | undefined,
  ): number {
    const multiplier = noiseMultiplier?.(date) ?? 1;
    return sq(this.relativeScaleSigma * weightKg) + (multiplier * multiplier - 1) * waterVar;
  }
}
