import { ArgumentError } from '../lang/ArgumentError';
import { bodyMassIndex } from './bodyMassIndex';
import { lowWeightCautionBmi, lowWeightMaxLossFraction, underweightBmi } from './lowWeightLimits';
import type { CalendarDate } from './CalendarDate';
import type { Caution } from './Caution';
import { GoalMode } from './GoalMode';
import type { Profile } from './Profile';
import type { ScreeningAnswers } from './ScreeningAnswers';

interface CoachingPolicyInit {
  blocked: boolean;
  allowedModes: ReadonlySet<GoalMode>;
  maintenanceOffsetKcal?: number;
  proteinCapGPerKg?: number | undefined;
  suppressWeightRewards?: boolean;
  elevatedMuscleGainPrior?: boolean;
  targetsAllowed?: boolean;
  minimumProteinGPerKgReferenceWeight?: number | undefined;
  underweight?: boolean;
  maxWeeklyLossFraction?: number | undefined;
  cautions?: ReadonlySet<Caution>;
}

/** What coaching the engine may offer, derived from profile and screening. */
export class CoachingPolicy {
  static readonly seniorMinimumProteinGPerKgReferenceWeight = 1.2;
  static readonly seniorMaxWeeklyLossFraction = 0.005;
  static readonly insulinUnconfirmedMaxWeeklyLossFraction = 0.005;

  /** True when the user may not receive coaching at all (under 18). */
  readonly blocked: boolean;

  readonly allowedModes: ReadonlySet<GoalMode>;

  /** Added to every calorie target (lactation energy cost). */
  readonly maintenanceOffsetKcal: number;

  /** Upper limit on protein, g per kg body weight; undefined when uncapped. */
  readonly proteinCapGPerKg: number | undefined;

  readonly suppressWeightRewards: boolean;
  readonly elevatedMuscleGainPrior: boolean;

  /** False when targets must be set by a user's surgical care team. */
  readonly targetsAllowed: boolean;

  /** A lower bound for protein per kg of reference weight, when applicable. */
  readonly minimumProteinGPerKgReferenceWeight: number | undefined;

  /** Body mass index is below 18.5: no deficit is planned (MM-111). */
  readonly underweight: boolean;

  /**
   * Upper limit on weekly loss, as a fraction of body weight; undefined when
   * only the body-fat limit applies.
   */
  readonly maxWeeklyLossFraction: number | undefined;

  readonly cautions: ReadonlySet<Caution>;

  private constructor(init: CoachingPolicyInit) {
    this.blocked = init.blocked;
    this.allowedModes = init.allowedModes;
    this.maintenanceOffsetKcal = init.maintenanceOffsetKcal ?? 0;
    this.proteinCapGPerKg = init.proteinCapGPerKg;
    this.suppressWeightRewards = init.suppressWeightRewards ?? false;
    this.elevatedMuscleGainPrior = init.elevatedMuscleGainPrior ?? false;
    this.targetsAllowed = init.targetsAllowed ?? true;
    this.minimumProteinGPerKgReferenceWeight = init.minimumProteinGPerKgReferenceWeight;
    this.underweight = init.underweight ?? false;
    this.maxWeeklyLossFraction = init.maxWeeklyLossFraction;
    this.cautions = init.cautions ?? new Set();
  }

  /**
   * Derives the policy. Throws `ArgumentError` for answers that contradict
   * biological sex (pregnancy, breastfeeding, PCOS, menopause for males).
   *
   * `weightKg` is the user's current (trend) weight. With it, a body mass
   * index below `underweightBmi` removes the deficit goals, and one below
   * `lowWeightCautionBmi` limits loss to the gentlest pace (MM-111).
   */
  static derive({
    profile,
    screening,
    today,
    weightKg,
  }: {
    profile: Profile;
    screening: ScreeningAnswers;
    today: CalendarDate;
    weightKg?: number | undefined;
  }): CoachingPolicy {
    const s = screening;
    if (profile.sex === 'male' && (s.pregnant || s.breastfeeding || s.pcos || s.menopause)) {
      throw new ArgumentError('Female-only screening answer for a male profile');
    }

    if (!profile.isAdultOn(today)) {
      return new CoachingPolicy({ blocked: true, allowedModes: new Set() });
    }

    // Pregnancy and lactation: maintenance only. Eating-disorder history: no
    // deficit modes, and no weight-based rewards anywhere in the UI.
    let allowedModes: ReadonlySet<GoalMode>;
    if (s.pregnant || s.breastfeeding) {
      allowedModes = new Set<GoalMode>(['maintenance']);
    } else if (s.eatingDisorderHistory) {
      allowedModes = new Set<GoalMode>(['maintenance', 'leanGain']);
    } else {
      allowedModes = new Set(GoalMode.values);
    }

    const bmi = weightKg === undefined ? undefined : bodyMassIndex({ weightKg, heightCm: profile.heightCm });
    const underweight = bmi !== undefined && bmi < underweightBmi;
    const lowWeight = bmi !== undefined && !underweight && bmi < lowWeightCautionBmi;
    const age = profile.ageOn(today);
    const maxLossLimits: number[] = [];
    if (lowWeight) maxLossLimits.push(lowWeightMaxLossFraction);
    if (age >= 65) maxLossLimits.push(CoachingPolicy.seniorMaxWeeklyLossFraction);
    if (s.insulinOrSulfonylurea && !s.insulinCareTeamConfirmed) {
      maxLossLimits.push(CoachingPolicy.insulinUnconfirmedMaxWeeklyLossFraction);
    }
    const offered = underweight
      ? new Set([...allowedModes].filter((mode) => mode !== 'fatLoss' && mode !== 'recomp'))
      : allowedModes;

    const cautions = new Set<Caution>();
    if (underweight) cautions.add('underweight');
    if (lowWeight) cautions.add('lowBodyWeight');
    if (s.pregnant) cautions.add('pregnancy');
    if (s.breastfeeding) cautions.add('breastfeeding');
    if (s.eatingDisorderHistory) cautions.add('eatingDisorderHistory');
    if (s.chronicKidneyDisease) cautions.add('chronicKidneyDisease');
    if (s.pcos) cautions.add('pcos');
    if (s.menopause) cautions.add('menopause');
    if (s.thyroidCondition) cautions.add('thyroidCondition');
    if (s.insulinOrSulfonylurea) cautions.add('insulinOrSulfonylurea');
    if (s.bariatricSurgery) cautions.add('bariatricSurgery');
    if (s.weightAffectingMedication) cautions.add('weightAffectingMedication');

    return new CoachingPolicy({
      blocked: false,
      allowedModes: offered,
      maintenanceOffsetKcal: s.breastfeeding ? 400 : 0,
      proteinCapGPerKg: s.chronicKidneyDisease ? 0.8 : undefined,
      minimumProteinGPerKgReferenceWeight:
        age >= 65 ? CoachingPolicy.seniorMinimumProteinGPerKgReferenceWeight : undefined,
      suppressWeightRewards: s.eatingDisorderHistory,
      elevatedMuscleGainPrior: s.androgenUse,
      targetsAllowed: !s.bariatricSurgery,
      underweight,
      maxWeeklyLossFraction: maxLossLimits.length === 0 ? undefined : Math.min(...maxLossLimits),
      cautions,
    });
  }
}
