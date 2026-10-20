import type { TrainingStatus } from '../domain/TrainingStatus';

/** Whether the person has said they do not train: no training days, or not lifting yet (MM-134). */
export function trainsNotYet({ trainingDaysPerWeek, trainingStatus }: { trainingDaysPerWeek: number; trainingStatus: TrainingStatus }): boolean {
  return trainingDaysPerWeek === 0 || trainingStatus === 'untrained';
}
