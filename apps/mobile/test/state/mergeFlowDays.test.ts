import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { HealthSample } from '../../src/healthIngest/HealthSample';
import { mergeFlowDays } from '../../src/state/mergeFlowDays';

/** MM-68, MM-19: the days of flow the trend works from are the marked ones and the platform's, each once. */
const today = CalendarDate.of(2026, 10, 6);
const flow = (date: CalendarDate, id: string, hour = 9): HealthSample => ({
  platformId: id,
  type: 'menstruation',
  value: 1,
  start: new Date(date.year, date.month - 1, date.day, hour),
  sourceId: 'tracker',
  sourceName: 'Cycle tracker',
});

it('marked and imported days are joined, each day once, oldest first', () => {
  const merged = mergeFlowDays({
    typed: [{ date: today.addDays(-1) }, { date: today.addDays(-3) }],
    imported: [flow(today.addDays(-1), 'a'), flow(today.addDays(-2), 'b'), flow(today.addDays(-2), 'c', 21)],
    today,
  });
  expect(merged.map((d) => d.date)).toEqual([today.addDays(-3), today.addDays(-2), today.addDays(-1)]);
});

it('a day after today and a reading of another kind are left out', () => {
  const other: HealthSample = { ...flow(today, 'w'), type: 'weight', value: 80 };
  const merged = mergeFlowDays({ typed: [], imported: [flow(today.addDays(1), 'late'), other], today });
  expect(merged).toEqual([]);
});
