import type { CalendarDate } from './CalendarDate';
import type { RecoveryQuestion } from './RecoveryQuestion';

interface RecoveryCheckInInit {
  date: CalendarDate;
  hunger: number;
  energy: number;
  sleep: number;
  training: number;
  mood: number;
  sleepHours?: number | undefined;
}

/**
 * The answers of one week on how the user is holding up (MM-116).
 * Observations, never combined into a score.
 */
export class RecoveryCheckIn {
  /** The day it was answered. */
  readonly date: CalendarDate;

  /** Each from 1 (the hard end) to 5 (the easy end). */
  readonly hunger: number;
  readonly energy: number;
  readonly sleep: number;
  readonly training: number;
  readonly mood: number;

  /** Typical hours of sleep, if the user gave them. */
  readonly sleepHours: number | undefined;

  constructor(init: RecoveryCheckInInit) {
    this.date = init.date;
    this.hunger = init.hunger;
    this.energy = init.energy;
    this.sleep = init.sleep;
    this.training = init.training;
    this.mood = init.mood;
    this.sleepHours = init.sleepHours;
  }

  answer(question: RecoveryQuestion): number {
    return this[question];
  }
}
