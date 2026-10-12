import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeStanding } from './IntakeStanding';

interface AdherenceSummaryInit {
  from: CalendarDate;
  to: CalendarDate;
  daysLogged: number;
  completeDays: number;
  weighIns: number;
  mostlyEstimated: boolean;
  averageIntakeKcal?: number | undefined;
  averageTargetKcal?: number | undefined;
  standing?: IntakeStanding | undefined;
  proteinDays?: number | undefined;
  workouts?: number | undefined;
}

/**
 * What the user did over a week, as separate facts (MM-149). There is no
 * score, percentage or grade combining them: a composite hides which thing
 * is wrong, and one that rises with closeness to target rewards under-eating.
 *
 * The coach's own rules read the same figures the user is shown.
 */
export class AdherenceSummary {
  readonly from: CalendarDate;
  readonly to: CalendarDate;

  /** Days with any food logged. */
  readonly daysLogged: number;

  /**
   * Of those, the days that count as whole days: marked complete, or
   * unmarked and passing the usable-day rule (MM-27). Partial and unlogged
   * days are not counted against anything.
   */
  readonly completeDays: number;
  readonly weighIns: number;

  /** Mean intake on the complete days; undefined with none. */
  readonly averageIntakeKcal: number | undefined;

  /**
   * Mean calorie target over the days of the week that had one; undefined
   * when no targets were in force.
   */
  readonly averageTargetKcal: number | undefined;

  /**
   * Where the average intake sits against the average target; undefined
   * when either is missing.
   */
  readonly standing: IntakeStanding | undefined;

  /**
   * Complete days at or above the protein minimum (MM-121); undefined when
   * no minimum was in force.
   */
  readonly proteinDays: number | undefined;

  /**
   * More than half the complete days' calories came from estimated entries
   * (MM-150), which limits what the average can be trusted for.
   */
  readonly mostlyEstimated: boolean;

  /** Undefined until the training log exists. */
  readonly workouts: number | undefined;

  constructor(init: AdherenceSummaryInit) {
    this.from = init.from;
    this.to = init.to;
    this.daysLogged = init.daysLogged;
    this.completeDays = init.completeDays;
    this.weighIns = init.weighIns;
    this.mostlyEstimated = init.mostlyEstimated;
    this.averageIntakeKcal = init.averageIntakeKcal;
    this.averageTargetKcal = init.averageTargetKcal;
    this.standing = init.standing;
    this.proteinDays = init.proteinDays;
    this.workouts = init.workouts;
  }

  /** Intake less target, signed; undefined when either is missing. */
  get distanceKcal(): number | undefined {
    const intake = this.averageIntakeKcal;
    const target = this.averageTargetKcal;
    return intake === undefined || target === undefined ? undefined : intake - target;
  }
}
