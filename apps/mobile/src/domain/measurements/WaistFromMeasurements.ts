import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';
import type { MeasurementRepository } from '../repositories/MeasurementRepository';
import type { WaistRepository } from '../repositories/WaistRepository';
import { WaistObservation } from '../WaistObservation';

/**
 * The waist as one site of the measurement store (MM-156): every waist
 * reader and writer keeps working while the waist lives with the other
 * sites. The store refuses a value no site can have.
 */
export class WaistFromMeasurements implements WaistRepository {
  private readonly measurements: MeasurementRepository;

  constructor(measurements: MeasurementRepository) {
    this.measurements = measurements;
  }

  watchWaist(): Watched<WaistObservation[]> {
    const site = this.measurements.watchSite('waist');
    return {
      subscribe: (listener, onError) =>
        site.subscribe(
          (observations) =>
            listener(
              observations.map(
                (o) => new WaistObservation({ date: o.date, waistCm: o.valueCm, readings: o.readings }),
              ),
            ),
          onError,
        ),
    };
  }

  saveWaist(date: CalendarDate, waistCm: number, options: { readings?: readonly number[] } = {}): Promise<void> {
    return this.measurements.saveMeasurement('waist', date, waistCm, options);
  }
}
