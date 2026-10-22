import type { PersonalRecord } from './PersonalRecord';
import type { StrengthTrend } from './StrengthTrend';

/**
 * The personal records in the strength history (MM-92), by the id of the
 * workout that set them.
 *
 * A session sets a record when its best estimated one-rep max is higher
 * than that of every earlier session of the lift. A lift's first session
 * sets none: there is nothing to beat. A record stays one when a later
 * session beats it; it was the best on its day. Each session's own
 * estimate is used, not the smoothed trend, which would lag the day the
 * work was done.
 */
export function personalRecordsOf(trends: Iterable<StrengthTrend>): Map<number, PersonalRecord[]> {
  const records = new Map<number, PersonalRecord[]>();
  for (const trend of trends) {
    let best: number | undefined;
    for (const point of trend.points) {
      const before = best;
      if (before !== undefined && point.estimateKg > before) {
        const record: PersonalRecord = {
          exerciseId: trend.exerciseId,
          name: trend.name,
          estimateKg: point.estimateKg,
          previousBestKg: before,
          load: trend.exercise?.load,
          bestSet: point.bestSet,
        };
        const sameWorkout = records.get(point.workoutId);
        if (sameWorkout === undefined) {
          records.set(point.workoutId, [record]);
        } else {
          sameWorkout.push(record);
        }
      }
      if (before === undefined || point.estimateKg > before) best = point.estimateKg;
    }
  }
  return records;
}
