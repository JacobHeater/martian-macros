import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { coachFindingOf } from '../../src/engine/analysis/coachFindingOf';
import { trainingAdviceOf } from '../../src/engine/analysis/trainingAdviceOf';
import { coachFindingText } from '../../src/format/coach/coachFindingText';
import { Fmt } from '../../src/format/Fmt';
import { coachBannedWords } from '../support/coachBannedWords';

/** MM-678: the coach's words on cardio and steps against their floors, drafts the owner reads on the phone. */
const fmt = new Fmt('metric');
const asOf = CalendarDate.of(2026, 10, 23);
const base = { span: 7, from: asOf.addDays(-6), to: asOf } as const;
const withOrders = (f: ReturnType<typeof coachFindingOf>) => ({ ...f, advice: trainingAdviceOf(f, false) });
const clean = (text: string) => expect(coachBannedWords.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)).toEqual([]);

it('cardio under the floor: the minutes against the floor, why, and the order with the shortfall', () => {
  const f = withOrders(coachFindingOf({ ...base, signal: 'cardioMinutes', kind: 'fix', priority: 'coaching', figures: { minutes: 96, floor: 150, more: 54, sessions: 3, days: 7 } }));
  const [title, body, evidence] = coachFindingText(f, fmt);
  expect(title).toBe('1 h 36 min of cardio this week');
  expect(body).toMatch(/1 h 36 min/);
  expect(body).toMatch(/2 h 30 min/);
  expect(body).toMatch(/54 min more/);
  expect(body).toMatch(/lifting/);
  expect(body).not.toMatch(/!/);
  expect(evidence).toEqual([
    ['Period', 'Oct 17 to Oct 23'],
    ['Cardio this week', '1 h 36 min'],
    ['Floor', '2 h 30 min a week'],
    ['Sessions', '3'],
  ]);
  clean(`${title} ${body}`);
});

it('cardio holding up: the weeks and this week, then keep that', () => {
  const f = coachFindingOf({ ...base, span: 30, from: asOf.addDays(-27), signal: 'cardioMinutes', kind: 'holdingUp', priority: 'pattern', figures: { weeks: 4, minutes: 160, floor: 150, sessions: 2 } });
  const [title, body, evidence] = coachFindingText(f, fmt);
  expect(title).toBe('Cardio over the floor for 4 weeks');
  expect(body).toMatch(/4 weeks/);
  expect(body).toMatch(/2 h 40 min/);
  expect(body).toMatch(/Keep (that|it there)\.|Same again next time\./);
  expect(evidence).toContainEqual(['Weeks over the floor', '4 of 4']);
  clean(`${title} ${body}`);
});

it('steps under the floor: the average against the floor and the order with the shortfall a day', () => {
  const f = withOrders(coachFindingOf({ ...base, signal: 'stepsPerDay', kind: 'fix', priority: 'coaching', figures: { steps: 6100, floor: 8000, short: 1900, days: 7 } }));
  const [title, body, evidence] = coachFindingText(f, fmt);
  expect(title).toBe('About 6,100 steps a day');
  expect(body).toMatch(/6,100/);
  expect(body).toMatch(/8,000/);
  expect(body).toMatch(/1,900 more/);
  expect(evidence).toEqual([
    ['Period', 'Oct 17 to Oct 23'],
    ['Steps a day, average', '6,100'],
    ['Days with steps', '7 of 7'],
    ['Floor', '8,000 a day'],
  ]);
  clean(`${title} ${body}`);
});

it('steps holding up: the floor and the weeks, then keep that', () => {
  const f = coachFindingOf({ ...base, span: 30, from: asOf.addDays(-27), signal: 'stepsPerDay', kind: 'holdingUp', priority: 'pattern', figures: { weeks: 4, steps: 8400, floor: 8000, days: 7 } });
  const [title, body] = coachFindingText(f, fmt);
  expect(title).toBe('Over 8,000 steps a day for 4 weeks');
  expect(body).toMatch(/4 weeks/);
  expect(body).toMatch(/Keep (that|it there)\.|Same again next time\./);
  clean(`${title} ${body}`);
});

it('under restricted neither fix carries an order', () => {
  const cardio = coachFindingOf({ ...base, signal: 'cardioMinutes', kind: 'fix', priority: 'coaching', figures: { minutes: 0, floor: 150, more: 150, sessions: 0, days: 7 } });
  const steps = coachFindingOf({ ...base, signal: 'stepsPerDay', kind: 'fix', priority: 'coaching', figures: { steps: 3000, floor: 8000, short: 5000, days: 7 } });
  expect(trainingAdviceOf(cardio, true)).toEqual([]);
  expect(trainingAdviceOf(steps, true)).toEqual([]);
});
