/**
 * The answer "I take a prescription weight-loss medication" (MM-113). Kept
 * apart from the broader `weightAffectingMedication` answer, which also
 * covers drugs that are not for weight loss.
 *
 * `ScreeningAnswers` carries it, stored with the setup (MM-510).
 */
export interface WeightLossMedicationAnswer {
  readonly weightLossMedication: boolean;
}
