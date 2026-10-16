import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { MonthlyReport } from '../../src/engine/MonthlyReport';
import { ReportPeriod } from '../../src/engine/ReportPeriod';
import { Fmt } from '../../src/format/Fmt';
import { MonthlyReportText } from '../../src/format/MonthlyReportText';

/** MM-332: why the coach measured nothing, said right at none and at one whole day. */
const today = CalendarDate.of(2026, 10, 12);
const text = (completeDays: number) =>
  new MonthlyReportText(
    new MonthlyReport({
      period: new ReportPeriod({ index: 0, from: today.addDays(-31) }),
      daysLogged: completeDays,
      completeDays,
      weighIns: 10,
      targetChanges: [],
      estimateGap: 'tooFewFoodDays',
    }),
    new Fmt('imperial'),
    today,
  ).estimate;

describe('too few whole days for the coach', () => {
  it('says none were logged, never "only 0"', () => {
    expect(text(0)).toMatch(/^Not measured this month: no whole days were logged, and the coach needs at least \d+/);
  });

  it('says one day in the singular', () => {
    expect(text(1)).toMatch(/^Not measured this month: only 1 whole day was logged,/);
  });

  it('says several as before', () => {
    expect(text(6)).toMatch(/^Not measured this month: only 6 whole days were logged,/);
  });
});
