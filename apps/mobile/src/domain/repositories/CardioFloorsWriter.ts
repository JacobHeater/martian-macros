import type { CardioFloors } from '../training/CardioFloors';

/** Sets the floors the coach holds cardio to (MM-678); undefined for either goes back to the coach's default. */
export interface CardioFloorsWriter {
  saveCardioFloors(floors: CardioFloors): Promise<void>;
}
