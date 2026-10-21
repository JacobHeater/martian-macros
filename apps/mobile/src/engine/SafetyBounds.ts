import type { BiologicalSex } from '../domain/BiologicalSex';
import type { CoachingPolicy } from '../domain/CoachingPolicy';
import type { TrainingStatus } from '../domain/TrainingStatus';
import { clamp } from '../lang/clamp';
import type { GoalBodyFatCheck } from './GoalBodyFatCheck';
import { ProteinRange } from './ProteinRange';
import type { ProteinTargets } from './ProteinTargets';

/** Energy availability floor, kcal per kg fat-free mass per day. */
const minEnergyAvailabilityKcalPerKgFfm = 30;
const maxWeeklyTargetChangeKcal = 100;
const maxWeeklyTargetChangeFraction = 0.05;

/**
 * The largest surplus, as a share of estimated expenditure (MM-129): more
 * adds fat, not muscle, in trained lifters (Helms 2023). Novices, returning
 * and untrained lifters gain lean mass faster, so theirs is wider.
 */
const maxSurplusFractionOfExpenditure = 0.1;
const maxSurplusFractionForNovices = 0.15;

/** Share of the weight above BMI 25 that counts toward `referenceWeightKg`. */
const excessWeightFraction = 0.25;

function absoluteFloorKcal(sex: BiologicalSex): number {
  return sex === 'male' ? 1500 : 1200;
}

/**
 * Body fat at or below which the energy-availability floor applies.
 * Low-energy-availability harm (RED-S) concentrates in lean users; for
 * higher body fat the floor would forbid ordinary moderate deficits.
 */
function energyAvailabilityThresholdPercent(sex: BiologicalSex): number {
  return sex === 'male' ? 15 : 25;
}

/**
 * The weight per-kilogram macro rules scale with: body weight up to
 * BMI 25, then the BMI-25 weight plus a quarter of the excess (the
 * "adjusted body weight" convention). Continuous, and it never falls as
 * weight rises, so a target cannot jump when a user crosses a BMI line.
 */
function referenceWeightKg({ weightKg, heightCm }: { weightKg: number; heightCm: number }): number {
  const heightM = heightCm / 100;
  const atBmi25 = 25 * heightM * heightM;
  if (weightKg <= atBmi25) return weightKg;
  return atBmi25 + excessWeightFraction * (weightKg - atBmi25);
}

/**
 * Hard physiological limits. Every target the engine emits passes through
 * these.
 *
 * Sources: NIH minimum-intake guidance (absolute floors), Loucks on low
 * energy availability (30 kcal/kg FFM), Garthe 2011 (slower loss preserves
 * lean mass), Helms 2014 (protein in lean, dieting athletes). The body-fat
 * goal floors are product judgement. This table must be signed off by a
 * registered dietitian before launch.
 */
export const SafetyBounds = {
  minEnergyAvailabilityKcalPerKgFfm,
  maxWeeklyTargetChangeKcal,
  maxWeeklyTargetChangeFraction,
  maxSurplusFractionOfExpenditure,
  maxSurplusFractionForNovices,
  excessWeightFraction,
  absoluteFloorKcal,
  energyAvailabilityThresholdPercent,
  referenceWeightKg,

  /**
   * The lowest calorie target the engine will ever emit: the larger of the
   * absolute floor, BMR, and (for lean users) the energy-availability
   * floor.
   *
   * Pass the *upper* bound of fat-free mass so that measurement
   * uncertainty can only raise the floor.
   */
  calorieFloorKcal({
    sex,
    bmrKcal,
    bodyFatPercent,
    fatFreeMassUpperKg,
    trainingKcalPerDay,
  }: {
    sex: BiologicalSex;
    bmrKcal: number;
    bodyFatPercent: number;
    fatFreeMassUpperKg: number;
    trainingKcalPerDay: number;
  }): number {
    const floors = [absoluteFloorKcal(sex), bmrKcal];
    if (bodyFatPercent <= energyAvailabilityThresholdPercent(sex)) {
      floors.push(minEnergyAvailabilityKcalPerKgFfm * fatFreeMassUpperKg + trainingKcalPerDay);
    }
    return Math.max(...floors);
  },

  /**
   * Fastest allowed loss, as a fraction of body weight per week. Tapers as
   * the user gets leaner.
   */
  maxWeeklyLossFraction(sex: BiologicalSex, bodyFatPercent: number): number {
    const [slowBelow, moderateBelow] = sex === 'male' ? [12, 15] : [22, 25];
    if (bodyFatPercent < slowBelow) return 0.005;
    if (bodyFatPercent < moderateBelow) return 0.007;
    return 0.01;
  },

  /**
   * The largest daily surplus over estimated expenditure, kcal (MM-129),
   * whatever the percentage pace asks. It is on measured expenditure, so it
   * rises when expenditure does.
   */
  maxSurplusKcal(trainingStatus: TrainingStatus, tdeeKcal: number): number {
    const trained = trainingStatus === 'intermediate' || trainingStatus === 'advanced';
    return (trained ? maxSurplusFractionOfExpenditure : maxSurplusFractionForNovices) * tdeeKcal;
  },

  /** Largest allowed change from last week's calorie target. */
  maxWeeklyTargetChange(currentKcal: number): number {
    return Math.min(maxWeeklyTargetChangeKcal, currentKcal * maxWeeklyTargetChangeFraction);
  },

  /**
   * Minimum daily fat, g: the larger of a floor per kg of reference weight
   * and 20% of energy.
   */
  minFatG({
    sex,
    weightKg,
    heightCm,
    kcal,
  }: {
    sex: BiologicalSex;
    weightKg: number;
    heightCm: number;
    kcal: number;
  }): number {
    const perKg = sex === 'male' ? 0.5 : 0.6;
    const reference = referenceWeightKg({ weightKg, heightCm });
    return Math.max(perKg * reference, (0.2 * kcal) / 9);
  },

  /** Chooses the protein minimum and target for the user's goal and training. */
  proteinTargetsG({
    sex,
    weightKg,
    heightCm,
    bodyFatPercent,
    inDeficit,
    lifting,
    policy,
  }: {
    sex: BiologicalSex;
    weightKg: number;
    heightCm: number;
    bodyFatPercent: number;
    inDeficit: boolean;
    lifting: boolean;
    policy: CoachingPolicy;
  }): ProteinTargets {
    const reference = referenceWeightKg({ weightKg, heightCm });
    let minimum = (lifting ? 1.6 : 1.2) * reference;
    let target = (lifting ? (inDeficit ? 2.0 : 1.8) : 1.6) * reference;
    if (inDeficit) {
      const leanThreshold = sex === 'male' ? 15 : 23;
      const leanShare = clamp((leanThreshold + 3 - bodyFatPercent) / 3, 0, 1);
      if (leanShare > 0) {
        const fatFreeMass = weightKg * (1 - bodyFatPercent / 100);
        minimum = minimum * (1 - leanShare) + 2.3 * fatFreeMass * leanShare;
        target = target * (1 - leanShare) + 2.6 * fatFreeMass * leanShare;
      }
    }
    const seniorFloor = policy.minimumProteinGPerKgReferenceWeight;
    if (seniorFloor !== undefined) {
      minimum = Math.max(minimum, seniorFloor * reference);
    }
    const kidneyCap = policy.proteinCapGPerKg;
    if (kidneyCap !== undefined) {
      const capped = kidneyCap * weightKg;
      return { minimumG: capped, targetG: capped };
    }
    return { minimumG: minimum, targetG: target };
  },

  /**
   * Evidence range for protein, g; production targets use `proteinTargetsG`.
   *
   * Lean users in a deficit get 2.3–3.1 g/kg fat-free mass (Helms 2014).
   * Otherwise 1.6–2.2 g/kg of `referenceWeightKg`, so heavier users don't
   * get absurd targets.
   * `capGPerKg` (kidney disease) caps everything.
   */
  proteinRangeG({
    sex,
    weightKg,
    heightCm,
    bodyFatPercent,
    inDeficit,
    capGPerKg,
  }: {
    sex: BiologicalSex;
    weightKg: number;
    heightCm: number;
    bodyFatPercent: number;
    inDeficit: boolean;
    capGPerKg?: number | undefined;
  }): ProteinRange {
    const leanThreshold = sex === 'male' ? 15 : 23;
    let range: ProteinRange;
    if (inDeficit && bodyFatPercent <= leanThreshold) {
      const ffm = weightKg * (1 - bodyFatPercent / 100);
      range = new ProteinRange(2.3 * ffm, 3.1 * ffm);
    } else {
      const reference = referenceWeightKg({ weightKg, heightCm });
      range = new ProteinRange(1.6 * reference, 2.2 * reference);
    }
    if (capGPerKg !== undefined) {
      const cap = capGPerKg * weightKg;
      range = new ProteinRange(Math.min(range.minG, cap), Math.min(range.maxG, cap));
    }
    return range;
  },

  /** Validates a user-chosen goal body fat. */
  checkGoalBodyFat(sex: BiologicalSex, percent: number): GoalBodyFatCheck {
    const [hardFloor, softFloor] = sex === 'male' ? [8, 10] : [16, 18];
    if (percent < hardFloor) return 'rejected';
    if (percent < softFloor) return 'warnAndTimeLimit';
    return 'accepted';
  },
} as const;
