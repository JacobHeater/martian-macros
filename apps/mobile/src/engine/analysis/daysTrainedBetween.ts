import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';

/** How many days from `from` to `to`, both included, were trained (MM-609). */
export function daysTrainedBetween(context: TrainingAnalysisContext, from: CalendarDate, to: CalendarDate): number {
  let days = 0;
  for (let day = from.epochDay; day <= to.epochDay; day++) if (context.trainedDays.has(day)) days++;
  return days;
}
