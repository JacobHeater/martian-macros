/**
 * The figures of the "water logged on few days" inline insight (MM-367).
 * Each is a judgement recorded in the evidence register. The rule measures
 * logging, not drinking (the panel's ME-8, CO-1).
 */
export const WaterFewDaysRule = {
  /** The complete days counted, before the day shown. */
  windowDays: 14,
  /** Fewer days with water than this is few: half, the app's convention. */
  fewerThanDays: 7,
  /** The person has logged water in this many days before the window, so a feature never used gets no line. */
  usedWithinDays: 60,
} as const;
