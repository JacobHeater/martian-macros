import type { CalendarDate } from '../domain/CalendarDate';
import type { ExplanationLine } from './ExplanationLine';
import type { TdeeStatus } from './TdeeStatus';

/**
 * A change in targets made during the month, with the estimate it was based
 * on (MM-33).
 */
export interface ReportTargetChange {
  readonly date: CalendarDate;

  /** Undefined for the very first targets. */
  readonly previousKcal?: number | undefined;
  readonly newKcal: number;

  /** The expenditure estimate the targets were made from. */
  readonly tdeeKcal: number;
  readonly tdeeSigmaKcal: number;
  readonly tdeeStatus: TdeeStatus;

  /** Why, as the contributions recorded when they were issued (MM-138). */
  readonly lines: readonly ExplanationLine[];
}
