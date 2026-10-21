import type { WeightLossMedicationAnswer } from './WeightLossMedicationAnswer';

const names = [
  'pregnant',
  'breastfeeding',
  'eatingDisorderHistory',
  'chronicKidneyDisease',
  'androgenUse',
  'pcos',
  'menopause',
  'thyroidCondition',
  'insulinOrSulfonylurea',
  'insulinCareTeamConfirmed',
  'bariatricSurgery',
  'weightAffectingMedication',
  'fluidLimitedByClinician',
  'sleepDisorder',
  'weightLossMedication',
] as const;

type ScreeningAnswersInit = { [name in (typeof names)[number]]?: boolean };

/** Answers to the onboarding health screen. Every one is "no" unless given. */
export class ScreeningAnswers implements WeightLossMedicationAnswer {
  readonly pregnant: boolean;
  readonly breastfeeding: boolean;
  readonly eatingDisorderHistory: boolean;
  readonly chronicKidneyDisease: boolean;

  /** TRT or anabolic steroid use. Not blocking; raises the muscle-gain prior. */
  readonly androgenUse: boolean;

  readonly pcos: boolean;
  readonly menopause: boolean;
  readonly thyroidCondition: boolean;
  readonly insulinOrSulfonylurea: boolean;
  readonly insulinCareTeamConfirmed: boolean;
  readonly bariatricSurgery: boolean;
  readonly weightAffectingMedication: boolean;

  /** A clinician limits how much the person drinks (MM-359): no water goal is suggested. */
  readonly fluidLimitedByClinician: boolean;

  /**
   * A clinician has diagnosed a sleep disorder: sleep apnea, insomnia, a
   * shift-work or other circadian disorder (MM-251). Refer-only: a caution and
   * a pointer to the clinician, and no number changes.
   */
  readonly sleepDisorder: boolean;

  /**
   * "I take a prescription weight-loss medication" (MM-113, MM-510). Not
   * blocking. Kept apart from `weightAffectingMedication`, which also covers
   * drugs that are not for weight loss, and never read in its place.
   */
  readonly weightLossMedication: boolean;

  constructor(init: ScreeningAnswersInit = {}) {
    this.pregnant = init.pregnant ?? false;
    this.breastfeeding = init.breastfeeding ?? false;
    this.eatingDisorderHistory = init.eatingDisorderHistory ?? false;
    this.chronicKidneyDisease = init.chronicKidneyDisease ?? false;
    this.androgenUse = init.androgenUse ?? false;
    this.pcos = init.pcos ?? false;
    this.menopause = init.menopause ?? false;
    this.thyroidCondition = init.thyroidCondition ?? false;
    this.insulinOrSulfonylurea = init.insulinOrSulfonylurea ?? false;
    this.insulinCareTeamConfirmed = init.insulinCareTeamConfirmed ?? false;
    this.bariatricSurgery = init.bariatricSurgery ?? false;
    this.weightAffectingMedication = init.weightAffectingMedication ?? false;
    this.fluidLimitedByClinician = init.fluidLimitedByClinician ?? false;
    this.sleepDisorder = init.sleepDisorder ?? false;
    this.weightLossMedication = init.weightLossMedication ?? false;
  }

  /** Whether every answer is the same as in `other`. */
  equals(other: ScreeningAnswers): boolean {
    return names.every((name) => this[name] === other[name]);
  }
}
