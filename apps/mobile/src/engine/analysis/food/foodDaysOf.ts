import type { CalendarDate } from '../../../domain/CalendarDate';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { IntakeDay } from '../../../domain/IntakeDay';
import { usableIntakeDays } from '../../usableIntakeDays';
import type { FoodAnalysisInput } from './FoodAnalysisInput';
import type { FoodDay } from './FoodDay';
import { recordOnOf } from './recordOnOf';

/**
 * One `FoodDay` per calendar day from `from` through `to` (MM-606). Which
 * days are whole is judged over these days together, as the expenditure
 * estimate judges them (`usableIntakeDays`, each day read against its
 * plan).
 */
export function foodDaysOf(input: FoodAnalysisInput, from: CalendarDate, to: CalendarDate): FoodDay[] {
  const inRange = (date: CalendarDate) => !date.isBefore(from) && !date.isAfter(to);
  const intake = new Map<CalendarDate, IntakeDay>();
  for (const d of input.intake) if (inRange(d.date) && d.kcal > 0) intake.set(d.date, d);
  const whole = new Set(usableIntakeDays([...intake.values()], { plannedShare: input.plannedShare }).map((d) => d.date));
  const entries = new Map<CalendarDate, FoodEntry[]>();
  for (const e of input.entries) {
    if (!inRange(e.date)) continue;
    const list = entries.get(e.date);
    if (list === undefined) entries.set(e.date, [e]);
    else list.push(e);
  }
  const recordOn = recordOnOf(input.history);
  const days: FoodDay[] = [];
  for (let date = from; !date.isAfter(to); date = date.addDays(1)) {
    const record = recordOn(date);
    days.push({
      date,
      entries: entries.get(date) ?? [],
      intake: intake.get(date),
      whole: whole.has(date),
      record,
      kcalTarget: record === undefined ? undefined : record.targets.kcal * (input.plannedShare?.(date) ?? 1),
      kind: input.markedDays.get(date.epochDay) ?? 'none',
    });
  }
  return days;
}
