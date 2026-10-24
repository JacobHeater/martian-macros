import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { MonthlyReport } from '../../src/engine/MonthlyReport';
import { ReportPeriod } from '../../src/engine/ReportPeriod';
import { Fmt } from '../../src/format/Fmt';
import { MonthlyReportText } from '../../src/format/MonthlyReportText';

/** MM-611: the days marked a Refeed or a Day off, stated in the report as counts, with no comment. */
const today = CalendarDate.of(2026, 10, 30);
const work = (refeeds: number, daysOff: number) =>
  new MonthlyReportText(
    new MonthlyReport({
      period: new ReportPeriod({ index: 0, from: today.addDays(-29) }),
      daysLogged: 26,
      completeDays: 24,
      weighIns: 20,
      targetChanges: [],
      refeeds,
      daysOff,
    }),
    new Fmt('metric'),
    today,
  ).work;

it('2 refeeds and 1 day off are two plain counts after the whole days', () => {
  const lines = work(2, 1);
  const labels = lines.map(([label]) => label);
  expect(labels.slice(0, 4)).toEqual(['Days logged', 'Whole days', 'Refeeds', 'Days off']);
  expect(lines[2]).toEqual(['Refeeds', '2']);
  expect(lines[3]).toEqual(['Days off', '1']);
});

it('a month with no marks says nothing about them', () => {
  const labels = work(0, 0).map(([label]) => label);
  expect(labels).not.toContain('Refeeds');
  expect(labels).not.toContain('Days off');
});
