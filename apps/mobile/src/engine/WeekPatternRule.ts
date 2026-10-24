/**
 * The thresholds of the insight rules about the shape of the week
 * (MM-141): weekends running higher than weekdays, and one weekday that is
 * repeatedly the highest or the unlogged day. Product judgement: tune them
 * here.
 */
export const WeekPatternRule = {
  /** A week's weekend days average this share of the target above that week's own weekdays. */
  weekendExcessOfTarget: 0.2,

  /**
   * Weekends are paired within their own Monday-to-Sunday week, over this many weeks (MM-615). A week counts when it has
   * a whole weekend day and this many whole weekdays.
   */
  weekendWeeks: 5,
  minimumWeekdaysPerWeek: 3,

  /** Every counted week higher, over at least this many weeks; or, over at least `mostAgreeWeeks`, this share higher. */
  allAgreeWeeks: 3,
  mostAgreeWeeks: 5,
  mostAgreeShare: 0.8,

  /** A week of the day patterns has this many logged (or, for the highest day, whole) days to compare. */
  minimumDaysPerWeek: 5,

  /**
   * One weekday is the unlogged day when it went unlogged in at least `unloggedMinimumWeeks` of the last
   * `unloggedWeeks` weeks, each with `minimumDaysPerWeek` logged days, and makes up more than half of the days without a
   * log over those weeks (MM-614).
   */
  unloggedWeeks: 4,
  unloggedMinimumWeeks: 3,

  /** A week's highest day stands out only this share of the target above the week's other days. */
  highestDayExcessOfTarget: 0.15,
} as const;
