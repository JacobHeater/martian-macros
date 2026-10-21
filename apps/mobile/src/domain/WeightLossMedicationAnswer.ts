/**
 * The answer "I take a prescription weight-loss medication" (MM-113). Kept
 * apart from the broader `weightAffectingMedication` answer, which also
 * covers drugs that are not for weight loss.
 *
 * Not stored yet (MM-510): nothing on the phone asks it or reads it until
 * the setup table has a column for it, so the answer is never forgotten on
 * a restart. `ScreeningAnswers` takes it on then.
 */
export interface WeightLossMedicationAnswer {
  readonly weightLossMedication: boolean;
}
