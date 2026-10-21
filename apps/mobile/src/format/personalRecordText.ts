import type { PersonalRecord } from '../engine';
import type { Fmt } from './Fmt';

/**
 * One personal record in a line (MM-92): "Back squat: estimated max
 * 110.0 kg, up from 107.5 kg."
 */
export function personalRecordText(record: PersonalRecord, fmt: Fmt): string {
  return `${record.name}: estimated max ${fmt.load(record.estimateKg)}, up from ${fmt.load(record.previousBestKg)}.`;
}
