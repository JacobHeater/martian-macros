import type { CalendarDate } from './CalendarDate';

interface WaistObservationInit {
  date: CalendarDate;
  waistCm: number;
  readings?: readonly number[];
}

/** Waist circumference at the navel on one day (MM-21, MM-155). */
export class WaistObservation {
  /**
   * No adult waist is outside these; a value that is was mistyped, or is
   * in the wrong unit.
   */
  static readonly minCm = 30;
  static readonly maxCm = 300;

  readonly date: CalendarDate;

  /** The measurement: the middle of `readings` when there are three. */
  readonly waistCm: number;

  /**
   * The readings as taken, in the order entered: three, or one for a
   * quick entry. Empty for an entry made before readings were kept, which
   * the card asked to be the middle of three.
   */
  readonly readings: readonly number[];

  constructor(init: WaistObservationInit) {
    this.date = init.date;
    this.waistCm = init.waistCm;
    this.readings = init.readings ?? [];
  }

  /**
   * Whether this is one reading, which is noisier than the middle of
   * three.
   */
  get isSingleReading(): boolean {
    return this.readings.length === 1;
  }

  /** Whether the day, the measurement and every reading are the same. */
  equals(other: WaistObservation): boolean {
    return (
      other.date === this.date &&
      other.waistCm === this.waistCm &&
      other.readings.length === this.readings.length &&
      this.readings.every((reading, i) => reading === other.readings[i])
    );
  }
}
