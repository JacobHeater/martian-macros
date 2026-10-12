import type { IntakeDay, WeightObservation } from '../../../src/domain';

export interface Logs {
  readonly intake: IntakeDay[];
  readonly weights: WeightObservation[];
  readonly trueTdee: number[];
}
