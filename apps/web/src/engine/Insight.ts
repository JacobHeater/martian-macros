import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightRule } from './InsightRule';
import type { StallAssessment } from './StallAssessment';

interface InsightInit {
  rule: InsightRule;
  from: CalendarDate;
  to: CalendarDate;
  figures?: Readonly<Record<string, number>>;
  stall?: StallAssessment | undefined;
}

/**
 * One thing the coach noticed in the user's own data (MM-141): the rule that
 * produced it, the period it rests on and the figures observed. The words
 * are fixed templates filled from `figures`; nothing is generated.
 */
export class Insight {
  readonly rule: InsightRule;

  /**
   * The period it was computed from. Never a single day: the minimum basis
   * is seven days.
   */
  readonly from: CalendarDate;
  readonly to: CalendarDate;

  /** The observed numbers, by name, shown as the evidence. */
  readonly figures: Readonly<Record<string, number>>;

  /** The diagnosis, for the stall rule. */
  readonly stall: StallAssessment | undefined;

  constructor(init: InsightInit) {
    this.rule = init.rule;
    this.from = init.from;
    this.to = init.to;
    this.figures = init.figures ?? {};
    this.stall = init.stall;
  }

  get basisDays(): number {
    return this.from.daysUntil(this.to) + 1;
  }
}
