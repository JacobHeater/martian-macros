import { ArgumentError } from '../lang/ArgumentError';
import type { BiologicalSex } from './BiologicalSex';
import type { CalendarDate } from './CalendarDate';

/** The user's stable physiological identity. */
export class Profile {
  readonly sex: BiologicalSex;
  readonly birthDate: CalendarDate;
  readonly heightCm: number;

  constructor(init: { sex: BiologicalSex; birthDate: CalendarDate; heightCm: number }) {
    if (init.heightCm < 100 || init.heightCm > 250) {
      throw new ArgumentError(`Invalid heightCm (${init.heightCm}): Must be 100–250 cm`);
    }
    this.sex = init.sex;
    this.birthDate = init.birthDate;
    this.heightCm = init.heightCm;
  }

  /** Completed years of age on `date`. */
  ageOn(date: CalendarDate): number {
    let age = date.year - this.birthDate.year;
    const hadBirthday =
      date.month > this.birthDate.month ||
      (date.month === this.birthDate.month && date.day >= this.birthDate.day);
    if (!hadBirthday) age--;
    return age;
  }

  /** The app is 18+ only; see `CoachingPolicy`. */
  isAdultOn(date: CalendarDate): boolean {
    return this.ageOn(date) >= 18;
  }
}
