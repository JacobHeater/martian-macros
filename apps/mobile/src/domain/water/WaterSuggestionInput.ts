import type { BiologicalSex } from '../BiologicalSex';
import type { ScreeningAnswers } from '../ScreeningAnswers';
import type { UnitSystem } from '../UnitSystem';

/** What a suggested water goal is worked out from (MM-358). */
export interface WaterSuggestionInput {
  sex: BiologicalSex;
  /** The trend or latest weigh-in; without one the protein term is left out. */
  weightKg: number | undefined;
  /** The daily protein target in force; without one the protein term is left out. */
  proteinTargetG: number | undefined;
  trainingDaysPerWeek: number;
  screening: ScreeningAnswers;
  units: UnitSystem;
}
