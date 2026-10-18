import { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthSample } from '../healthIngest/HealthSample';
import type { MmHealthRecord } from './MmHealthRecord';

/**
 * A reading from the plugin as the app keeps it (MM-68), in the app's one
 * unit per type, or undefined for a kind of reading the app does not
 * import.
 *
 * Height arrives in meters and is kept in centimeters. A workout is kept
 * as its length in minutes, and a day of menstrual flow as 1; what the
 * platform says about either beyond that is not imported.
 */
export function healthConnectSample(record: MmHealthRecord): HealthSample | undefined {
  if (!(HealthDataType.values as readonly string[]).includes(record.type)) return undefined;
  const type = record.type as HealthDataType;
  let value: number;
  switch (type) {
    case 'workout':
      value = (record.endMs - record.startMs) / 60000;
      break;
    case 'menstruation':
      value = 1;
      break;
    case 'height':
      if (record.value === undefined) return undefined;
      value = record.value * 100;
      break;
    default:
      if (record.value === undefined) return undefined;
      value = record.value;
  }
  const spans = record.endMs > record.startMs;
  return {
    platformId: record.id,
    type,
    value,
    start: new Date(record.startMs),
    end: spans ? new Date(record.endMs) : undefined,
    sourceId: record.sourceId,
    // No name stays none: a package id is never shown as one (MM-395).
    sourceName: record.sourceName,
  };
}
