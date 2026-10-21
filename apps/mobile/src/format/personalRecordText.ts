import type { PersonalRecord } from '../engine';
import type { Fmt } from './Fmt';
import { setText } from './setText';

/**
 * One personal record in a line (MM-92): "Back squat: estimated max
 * 110.0 kg, up from 107.5 kg." With the weight hidden (MM-118), a
 * bodyweight lift's estimate carries the body weight, so its record is the
 * set that made it: "Pull-up: a new best, 8 × +10 kg."
 */
export function personalRecordText(record: PersonalRecord, fmt: Fmt): string {
  if (record.load === 'bodyweight' && fmt.weightHidden) {
    return record.bestSet === undefined
      ? `${record.name}: a new best.`
      : `${record.name}: a new best, ${setText(record.bestSet, fmt, 'bodyweight')}.`;
  }
  return `${record.name}: estimated max ${fmt.load(record.estimateKg)}, up from ${fmt.load(record.previousBestKg)}.`;
}
