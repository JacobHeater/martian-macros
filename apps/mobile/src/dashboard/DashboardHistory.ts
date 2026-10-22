import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import type { WeightObservation } from '../domain/WeightObservation';
import { pauseOn } from '../engine/pauseOn';
import type { TargetsRecord } from '../engine/TargetsRecord';

const mean = (values: Iterable<number>): number | undefined => {
  const all = [...values];
  return all.length === 0 ? undefined : all.reduce((a, b) => a + b, 0) / all.length;
};

/** Display facts from recorded history, without assigning a score to a day. */
export class DashboardHistory {
  readonly today: CalendarDate;
  readonly days: number;
  readonly start: CalendarDate;
  readonly calories = new Map<CalendarDate, number>();
  readonly protein = new Map<CalendarDate, number>();
  readonly calorieTargets = new Map<CalendarDate, number>();
  readonly proteinTargets = new Map<CalendarDate, number>();
  readonly activeDays: number;
  readonly loggedDays: number;
  readonly completeDays: number;
  readonly weighInDays: number;
  /** Today, while its log is not marked complete: drawn apart and left out of the averages (MM-335). */
  readonly unfinished: CalendarDate | undefined;
  /** Paused days with a log: drawn, but left out of the averages as they are out of coverage (MM-176). */
  private readonly pausedLogs = new Set<CalendarDate>();

  constructor({
    today,
    days,
    intake,
    history,
    pauses,
    weights,
    onboardedOn,
    targetsAllowed,
  }: {
    today: CalendarDate;
    days: number;
    intake: readonly IntakeDay[];
    history: readonly TargetsRecord[];
    pauses: readonly Pause[];
    weights: readonly WeightObservation[];
    onboardedOn: CalendarDate;
    targetsAllowed: boolean;
  }) {
    this.today = today;
    this.days = days;
    this.start = today.addDays(1 - days);
    const eligibleStart = onboardedOn.isAfter(this.start) ? onboardedOn : this.start;
    const paused = (date: CalendarDate) => pauseOn(pauses, date) !== undefined;

    let activeDays = 0;
    for (let i = 0; i < days; i++) {
      const date = this.start.addDays(i);
      if (date.isBefore(eligibleStart) || paused(date)) continue;
      activeDays++;
      if (!targetsAllowed) continue;
      let record: TargetsRecord | undefined;
      for (const candidate of history) {
        if (!candidate.effectiveFrom.isAfter(date)) record = candidate;
      }
      if (record === undefined) continue;
      this.calorieTargets.set(date, record.targets.kcal);
      this.proteinTargets.set(date, record.targets.proteinMinimumG ?? record.targets.proteinG);
    }

    let loggedDays = 0;
    let completeDays = 0;
    for (const day of intake) {
      if (day.date.isBefore(eligibleStart) || day.date.isAfter(today)) continue;
      if (day.kcal > 0 || day.completeness === 'complete') {
        this.calories.set(day.date, day.kcal);
        this.protein.set(day.date, day.proteinG);
      }
      if (paused(day.date)) {
        this.pausedLogs.add(day.date);
        continue;
      }
      if (this.calories.has(day.date)) loggedDays++;
      if (day.completeness === 'complete') completeDays++;
    }

    const todays = intake.find((day) => day.date === today);
    this.unfinished = todays?.completeness === 'complete' || !this.calories.has(today) ? undefined : today;
    this.activeDays = activeDays;
    this.loggedDays = loggedDays;
    this.completeDays = completeDays;
    this.weighInDays = new Set(
      weights
        .filter((w) => !w.date.isBefore(eligibleStart) && !w.date.isAfter(today) && !paused(w.date))
        .map((w) => w.date),
    ).size;
  }

  /**
   * The days whose logs count: every recorded day but an unfinished today
   * and a paused day, so an average uses the days the Logging row counts
   * (MM-176).
   */
  private finished(values: ReadonlyMap<CalendarDate, number>): number[] {
    return [...values]
      .filter(([date]) => date !== this.unfinished && !this.pausedLogs.has(date))
      .map(([, value]) => value);
  }

  /** How many recorded days the averages use. */
  get finishedDays(): number {
    return this.finished(this.calories).length;
  }

  /** How many paused days have a log: drawn, though no average uses them (MM-176). */
  get pausedDays(): number {
    return this.pausedLogs.size;
  }

  get meanCalories(): number | undefined {
    return mean(this.finished(this.calories));
  }

  /** How many recorded days the protein average uses (MM-176). */
  get proteinDays(): number {
    return this.finished(this.protein).length;
  }

  get meanProtein(): number | undefined {
    return mean(this.finished(this.protein));
  }
}
