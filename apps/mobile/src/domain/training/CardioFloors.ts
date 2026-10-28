/**
 * The floors the coach holds cardio to (MM-678), as the person set them in
 * Settings › Coach: undefined is the coach's default (`CardioRule`). Steps
 * a day is a whole number from 1,000 to 30,000; minutes a week from 0 to
 * 1,000.
 */
export interface CardioFloors {
  readonly stepsPerDay: number | undefined;
  readonly minutesPerWeek: number | undefined;
}

export const CardioFloors = {
  /** Neither set: the coach's defaults. */
  none: { stepsPerDay: undefined, minutesPerWeek: undefined } as CardioFloors,

  stepsAllowed(steps: number): boolean {
    return Number.isInteger(steps) && steps >= 1000 && steps <= 30000;
  },

  minutesAllowed(minutes: number): boolean {
    return Number.isInteger(minutes) && minutes >= 0 && minutes <= 1000;
  },
} as const;
