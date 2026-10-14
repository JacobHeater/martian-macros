import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistWriter } from '../domain/repositories/WaistWriter';
import { WaistObservation } from '../domain/WaistObservation';
import { middleReading } from '../engine/middleReading';
import { FormatError } from '../lang/FormatError';

/**
 * Records one waist reading or three, in centimeters, as the measurement
 * for `date` (MM-155): the middle one is kept. A reading that cannot be a
 * waist is refused here, so it is refused wherever it is typed (Progress,
 * the Dashboard, MM-301) and whatever stores it.
 */
export function saveWaistReadings(waist: WaistWriter, date: CalendarDate, readingsCm: readonly number[]): Promise<void> {
  if (readingsCm.some((reading) => reading < WaistObservation.minCm || reading > WaistObservation.maxCm)) {
    return Promise.reject(new FormatError('Not a waist measurement.'));
  }
  return waist.saveWaist(date, middleReading(readingsCm), { readings: readingsCm });
}
