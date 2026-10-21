import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { BodyFatEstimate } from '../../src/engine/BodyFatEstimate';
import type { EstimatedBodyFat } from '../../src/engine/EstimatedBodyFat';
import { MonthlyReport } from '../../src/engine/MonthlyReport';
import type { ReportBodyFat } from '../../src/engine/ReportBodyFat';
import { ReportPeriod } from '../../src/engine/ReportPeriod';
import { Fmt } from '../../src/format/Fmt';
import { MonthlyReportText } from '../../src/format/MonthlyReportText';

/** MM-450: the report's body fat is a range, never one number, and says what it rests on. */
const today = CalendarDate.of(2026, 10, 21);
const fromWaist = (percent: number): EstimatedBodyFat => ({
  estimate: new BodyFatEstimate({ percent, sigmaPercent: 4 }),
  basis: 'waist',
  waistEntries: 4,
});
const body = (bodyFat: ReportBodyFat | undefined) =>
  new MonthlyReportText(
    new MonthlyReport({
      period: new ReportPeriod({ index: 0, from: today.addDays(-31) }),
      daysLogged: 20,
      completeDays: 20,
      weighIns: 10,
      targetChanges: [],
      bodyFat,
    }),
    new Fmt('metric'),
    today,
  ).body;
const row = (bodyFat: ReportBodyFat | undefined) => body(bodyFat).find(([label]) => label === 'Body fat');

describe('body fat in the report', () => {
  it('says nothing before a range has settled', () => {
    expect(row(undefined)).toBeUndefined();
  });

  it('the range at the end of the month, from the waist', () => {
    const [, value, detail] = row({ end: fromWaist(24), start: undefined }) ?? [];
    expect(value).toBe('16–32% (from your waist)');
    expect(detail).toBe('At the end of the month; a tape narrows the range but cannot pin body fat down');
  });

  it('with a range when the month began, that range too, never a single figure', () => {
    const [, value, detail] = row({ end: fromWaist(24), start: fromWaist(25) }) ?? [];
    expect(value).toBe('16–32% (from your waist)');
    expect(detail).toBe('17–33% when the month began; a tape narrows the range but cannot pin body fat down');
  });
});
