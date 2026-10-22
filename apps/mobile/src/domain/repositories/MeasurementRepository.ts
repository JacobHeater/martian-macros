import type { MeasurementReader } from './MeasurementReader';
import type { MeasurementWriter } from './MeasurementWriter';

/** Reads and writes tape measurements of every site (MM-156). */
export interface MeasurementRepository extends MeasurementReader, MeasurementWriter {}
