/**
 * The shape of the user's week (MM-124): up to three weekdays set higher by
 * the same share of the flat daily figure, the other days lowered equally so
 * the week's total is unchanged. No higher days is a flat week, the default.
 */
export class WeekShape {
  static readonly maxHigherDays = 3;
  static readonly raises = [0.1, 0.2, 0.3] as const;

  /**
   * No lower day is more than this share under the flat figure: five very
   * low days and two feasts is a binge-restrict pattern with a settings
   * screen (MM-124).
   */
  static readonly maxLowering = 0.15;
  static readonly flat = new WeekShape({ higherDays: [], raise: 0.2 });

  /** Weekdays, Sunday as 0 (as `CalendarDate.weekday` numbers them), at most `maxHigherDays`. */
  readonly higherDays: ReadonlySet<number>;

  /** How much higher a higher day is than the flat figure, as a share of it: one of `raises`. */
  readonly raise: number;

  constructor({ higherDays, raise }: { higherDays: Iterable<number>; raise: number }) {
    const days = [...new Set(higherDays)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6).sort((a, b) => a - b);
    this.higherDays = new Set(days.slice(0, WeekShape.maxHigherDays));
    this.raise = WeekShape.raises.reduce((best, r) => (Math.abs(r - raise) < Math.abs(best - raise) ? r : best));
  }

  get isFlat(): boolean {
    return this.higherDays.size === 0;
  }
}
