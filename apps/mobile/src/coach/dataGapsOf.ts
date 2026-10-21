import type { CoachConfidence } from '../engine/CoachConfidence';
import type { HealthConnection } from '../state/HealthConnection';
import type { DataGap } from './DataGap';

/**
 * The gaps worth saying beside the estimates they weaken (MM-523), before
 * any is dismissed. Only what the person controls on the health platform
 * counts, and only while the coach is not yet sure of what it rests on:
 *
 * - `weight`: weigh-ins are on the platform and not allowed, and the coach's
 *   weigh-ins are not yet enough. Never with an eating-disorder history,
 *   since it would ask for more weighing (MM-34, MM-129).
 * - `history`: weight is read, the history permission was refused (MM-73),
 *   and the expenditure estimate is not yet sure.
 */
export function dataGapsOf({
  connection,
  confidence,
  eatingDisorderHistory,
}: {
  connection: HealthConnection | undefined;
  confidence: CoachConfidence;
  eatingDisorderHistory: boolean;
}): DataGap[] {
  if (connection === undefined || connection.available.size === 0) return [];
  const gaps: DataGap[] = [];
  const weightOffered = connection.available.has('weight') && !connection.permitted.has('weight');
  if (weightOffered && !eatingDisorderHistory && confidence.weighIns !== 'good') gaps.push('weight');
  if (connection.permitted.has('weight') && !connection.history && confidence.estimate !== 'good') gaps.push('history');
  return gaps;
}
