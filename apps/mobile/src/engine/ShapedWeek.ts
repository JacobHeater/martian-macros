/** A shaped week's two kinds of day (MM-124), from `shapeWeek`. */
export interface ShapedWeek {
  readonly higherKcal: number;
  readonly lowerKcal: number;

  /**
   * Why the higher days are less than asked, so the user is told: the lower
   * days would have gone under the calorie floor, or more than
   * `WeekShape.maxLowering` under the flat figure. Undefined when not.
   */
  readonly reducedBy: 'floor' | 'lowering' | undefined;
}
