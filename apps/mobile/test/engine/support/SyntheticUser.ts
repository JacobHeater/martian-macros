import { CalendarDate, IntakeDay, type WeightObservation } from '../../../src/domain';
import { energyDensityKcalPerKg, leanFractionOfChange } from '../../../src/engine';
import { clamp } from '../../../src/lang/clamp';
import { DartRandom } from '../../support/DartRandom';

interface SyntheticUserInit {
  seed: number;
  start?: CalendarDate;
  baseTdeeKcal?: number;
  startWeightKg?: number;
  bodyFatPercent?: number;
  underReportFraction?: number;
  entrySigma?: number;
  adherenceSigmaKcal?: number;
  skipLogProbability?: number;
  partialLogProbability?: number;
  skipWeighInProbability?: number;
  waterSigmaKg?: number;
  waterPersistence?: number;
  weighedShare?: number;
  resistanceTrained?: boolean;
  adaptationKcalPerKg?: number;
  glycogenSwingFraction?: number;
  glycogenTimeConstantDays?: number;
  glycogenFullDeficitFraction?: number;
}

/**
 * A simulated person with a known true physiology and realistic logging
 * and weigh-in behaviour. Deterministic for a given seed.
 *
 * Truth model: weight changes by (actual intake − true TDEE) / ρ, where ρ
 * comes from the same Forbes/Hall partition the engine assumes; true TDEE
 * adapts by `adaptationKcalPerKg` per kg lost; day-to-day weigh-ins carry
 * AR(1) water noise plus scale noise.
 *
 * With `glycogenSwingFraction` above zero the scale also carries a
 * glycogen-and-gut store that follows energy balance: it empties over a
 * few days in a deficit and refills at maintenance. It is water and food
 * mass, not tissue, and is deliberately a different model from anything
 * the engine assumes.
 */
export class SyntheticUser {
  private readonly random: DartRandom;
  readonly baseTdeeKcal: number;
  readonly startWeightKg: number;
  readonly entrySigma: number;
  readonly adherenceSigmaKcal: number;
  readonly skipWeighInProbability: number;
  readonly waterSigmaKg: number;
  readonly waterPersistence: number;
  readonly resistanceTrained: boolean;
  readonly adaptationKcalPerKg: number;

  /**
   * Scale weight lost to the glycogen-and-gut store in a sustained
   * deficit, as a fraction of starting weight. Zero switches it off.
   */
  readonly glycogenSwingFraction: number;

  /** Days for the store to cover about two thirds of the way to its level. */
  readonly glycogenTimeConstantDays: number;

  /**
   * The deficit, as a fraction of expenditure, at which the store is as
   * empty as it gets.
   */
  readonly glycogenFullDeficitFraction: number;

  // Mutable so tests can change behaviour mid-run.
  underReportFraction: number;
  skipLogProbability: number;
  partialLogProbability: number;
  weighedShare: number;

  today: CalendarDate;
  weightKg: number;
  fatMassKg: number;
  private water = 0;
  private glycogenKg = 0;

  constructor(init: SyntheticUserInit) {
    this.random = new DartRandom(init.seed);
    this.baseTdeeKcal = init.baseTdeeKcal ?? 2600;
    this.startWeightKg = init.startWeightKg ?? 85;
    this.underReportFraction = init.underReportFraction ?? 0;
    this.entrySigma = init.entrySigma ?? 0.08;
    this.adherenceSigmaKcal = init.adherenceSigmaKcal ?? 150;
    this.skipLogProbability = init.skipLogProbability ?? 0.05;
    this.partialLogProbability = init.partialLogProbability ?? 0;
    this.skipWeighInProbability = init.skipWeighInProbability ?? 0.15;
    this.waterSigmaKg = init.waterSigmaKg ?? 0.5;
    this.waterPersistence = init.waterPersistence ?? 0.65;
    this.weighedShare = init.weighedShare ?? 0;
    this.resistanceTrained = init.resistanceTrained ?? true;
    this.adaptationKcalPerKg = init.adaptationKcalPerKg ?? 22;
    this.glycogenSwingFraction = init.glycogenSwingFraction ?? 0;
    this.glycogenTimeConstantDays = init.glycogenTimeConstantDays ?? 3;
    this.glycogenFullDeficitFraction = init.glycogenFullDeficitFraction ?? 0.2;
    this.today = init.start ?? CalendarDate.of(2026, 1, 1);
    this.weightKg = this.startWeightKg;
    this.fatMassKg = (this.startWeightKg * (init.bodyFatPercent ?? 25)) / 100;
  }

  /** What the store currently adds to the scale (negative when depleted). */
  get glycogenOffsetKg(): number {
    return this.glycogenKg;
  }

  get trueTdeeKcal(): number {
    return this.baseTdeeKcal + this.adaptationKcalPerKg * (this.weightKg - this.startWeightKg);
  }

  get bodyFatPercent(): number {
    return (100 * this.fatMassKg) / this.weightKg;
  }

  /** Lives one day eating to `targetLoggedKcal` (in logging units). */
  liveDay(targetLoggedKcal: number): { intake: IntakeDay | undefined; weight: WeightObservation | undefined } {
    const ar = this.waterPersistence;
    this.water = ar * this.water + this.gauss() * this.waterSigmaKg * Math.sqrt(1 - ar * ar);

    const weighIn: WeightObservation | undefined =
      this.random.nextDouble() < this.skipWeighInProbability
        ? undefined
        : { date: this.today, weightKg: this.weightKg + this.glycogenKg + this.water + this.gauss() * 0.1 };

    // The user eats what they believe is the target; under-reporting means
    // they actually eat more than they log.
    const actual = targetLoggedKcal / (1 - this.underReportFraction) + this.gauss() * this.adherenceSigmaKcal;
    let logged = actual * (1 - this.underReportFraction) * (1 + this.gauss() * this.entrySigma);

    let intake: IntakeDay | undefined;
    if (this.random.nextDouble() >= this.skipLogProbability) {
      const partial = this.random.nextDouble() < this.partialLogProbability;
      if (partial) logged *= 0.3 + 0.3 * this.random.nextDouble();
      intake = new IntakeDay({
        date: this.today,
        kcal: logged,
        proteinG: (logged * 0.3) / 4,
        carbsG: (logged * 0.4) / 4,
        fatG: (logged * 0.3) / 9,
        relativeSigma: this.entrySigma,
        weighedShare: this.weighedShare,
      });
    }

    const balance = actual - this.trueTdeeKcal;
    if (this.glycogenSwingFraction > 0) {
      // Depletes fully at the reference deficit; a surplus overfills it a
      // little.
      const fill = clamp(balance / (this.glycogenFullDeficitFraction * this.trueTdeeKcal), -1, 0.25);
      const level = this.glycogenSwingFraction * this.startWeightKg * fill;
      this.glycogenKg += (level - this.glycogenKg) / this.glycogenTimeConstantDays;
    }
    const leanFraction = leanFractionOfChange({
      fatMassKg: this.fatMassKg,
      losing: balance < 0,
      resistanceTrained: this.resistanceTrained,
    });
    const deltaKg = balance / energyDensityKcalPerKg(leanFraction);
    this.weightKg += deltaKg;
    this.fatMassKg += deltaKg * (1 - leanFraction);

    this.today = this.today.addDays(1);
    return { intake, weight: weighIn };
  }

  private gauss(): number {
    const u1 = 1 - this.random.nextDouble();
    const u2 = this.random.nextDouble();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
