/**
 * The thresholds of the insight rules about the shape of the week
 * (MM-141): weekends running higher than weekdays, and one weekday that is
 * repeatedly the highest or the unlogged day. Product judgement: tune them
 * here.
 */
export const WeekPatternRule = {
  /** Weekend days average this share of the target above weekdays. */
  weekendExcessOfTarget: 0.2,

  /** The fewest whole weekend days and weekdays the comparison rests on. */
  minimumWeekendDays: 2,
  minimumWeekdays: 5,

  /** A day is consistent when it holds in both weeks of the pattern period, each with this many days to compare. */
  minimumDaysPerWeek: 5,

  /** A week's highest day stands out only this share of the target above the week's other days. */
  highestDayExcessOfTarget: 0.15,
} as const;
