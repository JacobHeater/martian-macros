import type { CalendarDate } from '../domain/CalendarDate';
import type { MuscleVolume } from './MuscleVolume';

export interface WeeklyVolume {
  readonly today: CalendarDate;
  readonly groups: readonly MuscleVolume[];
  readonly unmappedCurrentSets: number;
  readonly unmappedPreviousSets: number;
}
