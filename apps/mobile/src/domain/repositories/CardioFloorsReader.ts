import type { Watched } from '../../lang/Watched';
import type { CardioFloors } from '../training/CardioFloors';

/** The floors the coach holds cardio to, as the person set them (MM-678); neither set until they do. */
export interface CardioFloorsReader {
  watchCardioFloors(): Watched<CardioFloors>;
}
