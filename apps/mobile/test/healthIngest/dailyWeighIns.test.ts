import { describe, expect, it } from 'vitest';
import {
  dailyWeighIns,
  type DayWeighIn,
  type HealthSample,
  primaryWeightSource,
  WeighInWindow,
} from '../../src/healthIngest';
import { ArgumentError } from '../../src/lang/ArgumentError';
import { upTo } from '../support/upTo';

/** MM-71: which imported weigh-in counts for a day. */
let nextId = 0;

const weight = (kg: number, day: number, hour: number, minute: number, source = 'scale'): HealthSample => ({
  platformId: `w-${nextId++}`,
  type: 'weight',
  value: kg,
  start: new Date(2026, 8, day, hour, minute),
  sourceId: source,
  sourceName: source === 'scale' ? 'Bathroom scale' : 'Gym scale',
});

/** The one day found; the test fails when there is not exactly one. */
function only(days: readonly DayWeighIn[]): DayWeighIn {
  expect(days).toHaveLength(1);
  return days[0] as DayWeighIn;
}

it('morning and evening: the morning reading counts', () => {
  const day = only(dailyWeighIns([weight(82.9, 1, 21, 10), weight(82.1, 1, 6, 40)]));
  expect(day.kg).toBe(82.1);
  expect(day.basis).toBe('firstMorning');
  expect(day.at).toEqual(new Date(2026, 8, 1, 6, 40));
  expect(day.day).toEqual(new Date(2026, 8, 1));
  expect(day.sourceName).toBe('Bathroom scale');
  expect(day.readings).toBe(2);
});

it('two in the morning: the first of them counts', () => {
  const day = only(dailyWeighIns([weight(82.4, 1, 9, 0), weight(82.0, 1, 6, 40)]));
  expect(day.kg).toBe(82.0);
});

it('the morning runs from 04:00 up to noon', () => {
  expect(only(dailyWeighIns([weight(82, 1, 3, 59), weight(83, 1, 4, 0)])).kg).toBe(83);
  const noon = only(dailyWeighIns([weight(82, 1, 12, 0)]));
  expect(noon.basis).toBe('medianOfDay');
  expect(only(dailyWeighIns([weight(82, 1, 11, 59)])).basis).toBe('firstMorning');
});

it('no morning reading: the middle value counts', () => {
  const day = only(dailyWeighIns([weight(83.0, 1, 22, 0), weight(82.0, 1, 13, 0), weight(82.4, 1, 18, 0)]));
  expect(day.kg).toBe(82.4);
  expect(day.basis).toBe('medianOfDay');
  expect(day.at).toBeUndefined();
  expect(day.readings).toBe(3);
});

it('the middle of two is half way between them', () => {
  expect(only(dailyWeighIns([weight(82, 1, 13, 0), weight(83, 1, 20, 0)])).kg).toBe(82.5);
});

it("two scales: the primary scale's reading counts, even when the other was earlier", () => {
  const day = only(
    dailyWeighIns([weight(84.0, 1, 5, 0, 'gym'), weight(82.1, 1, 6, 40)], { primarySourceId: 'scale' }),
  );
  expect(day.kg).toBe(82.1);
  expect(day.sourceName).toBe('Bathroom scale');
  expect(day.readings).toBe(1);
});

it('a day with nothing from the primary scale uses the others', () => {
  const days = dailyWeighIns([weight(82.1, 1, 6, 40), weight(84.0, 2, 7, 0, 'gym')], { primarySourceId: 'scale' });
  expect(days.map((d) => d.kg)).toEqual([82.1, 84.0]);
  expect(days[days.length - 1]?.sourceName).toBe('Gym scale');
});

it('a middle value across two sources says so', () => {
  const day = only(dailyWeighIns([weight(82, 1, 13, 0), weight(83, 1, 20, 0, 'gym')]));
  expect(day.sourceName).toBe('several sources');
});

it('one answer per day, oldest day first, and only weight is read', () => {
  const days = dailyWeighIns([
    weight(81.9, 3, 7, 0),
    weight(82.3, 1, 7, 0),
    weight(82.1, 2, 7, 0),
    {
      platformId: 'f',
      type: 'bodyFat',
      value: 21,
      start: new Date(2026, 8, 4, 7),
      sourceId: 'scale',
      sourceName: 'Bathroom scale',
    },
  ]);
  expect(days.map((d) => d.day.getDate())).toEqual([1, 2, 3]);
});

it('the same readings in any order give the same result', () => {
  const readings = [
    weight(82.0, 1, 13, 0),
    weight(82.6, 1, 13, 0, 'gym'),
    weight(83.0, 1, 22, 0),
    weight(82.2, 2, 6, 0),
    weight(82.2, 2, 6, 0, 'gym'),
    weight(82.9, 2, 9, 0),
  ];
  const fields = (d: DayWeighIn) => [d.day, d.kg, d.basis, d.sourceName];
  const forward = dailyWeighIns(readings, { primarySourceId: 'gym' });
  const backward = dailyWeighIns([...readings].reverse(), { primarySourceId: 'gym' });
  expect(backward.map(fields)).toEqual(forward.map(fields));
});

describe('the primary scale', () => {
  const asOf = new Date(2026, 8, 30, 12);

  it('is the source with the most weigh-ins in the last thirty days', () => {
    const samples = [
      ...upTo(10).map((i) => weight(82, i + 1, 7, 0)),
      ...upTo(4).map((i) => weight(83, i + 1, 18, 0, 'gym')),
    ];
    expect(primaryWeightSource(samples, { asOf })).toBe('scale');
    expect(primaryWeightSource([...samples].reverse(), { asOf })).toBe('scale');
  });

  it('readings older than thirty days do not count toward it', () => {
    const samples = [
      ...upTo(10).map((i) => weight(82, i + 1, 7, 0)),
      weight(83, 20, 7, 0, 'gym'),
      weight(83, 21, 7, 0, 'gym'),
    ];
    expect(primaryWeightSource(samples, { asOf: new Date(2026, 9, 15) })).toBe('gym');
  });

  it('a tie goes to the id that sorts first, whatever the order', () => {
    const samples = [weight(82, 1, 7, 0), weight(83, 1, 8, 0, 'gym')];
    expect(primaryWeightSource(samples, { asOf })).toBe('gym');
    expect(primaryWeightSource([...samples].reverse(), { asOf })).toBe('gym');
  });

  it('is none with no weigh-ins', () => {
    expect(primaryWeightSource([], { asOf })).toBeUndefined();
  });
});

describe('a weigh-in window that was moved (MM-441)', () => {
  const late = new WeighInWindow({ startMinute: 14 * 60, endMinute: 22 * 60 });

  it('by default the usual window: the 06:40 reading counts', () => {
    const day = only(dailyWeighIns([weight(82.9, 1, 21, 10), weight(82.1, 1, 6, 40)], { window: undefined }));
    expect(day.kg).toBe(82.1);
    expect(day.basis).toBe('firstMorning');
  });

  it('moved to 14:00 to 22:00: the 15:10 reading counts, not the 09:00 one', () => {
    const day = only(
      dailyWeighIns([weight(82.4, 1, 9, 0), weight(82.0, 1, 15, 10), weight(82.8, 1, 21, 0)], { window: late }),
    );
    expect(day.kg).toBe(82.0);
    expect(day.basis).toBe('firstMorning');
    expect(day.at).toEqual(new Date(2026, 8, 1, 15, 10));
  });

  it('runs from its start up to, not including, its end', () => {
    expect(only(dailyWeighIns([weight(82, 1, 13, 59), weight(83, 1, 14, 0)], { window: late })).kg).toBe(83);
    expect(only(dailyWeighIns([weight(82, 1, 22, 0)], { window: late })).basis).toBe('medianOfDay');
    expect(only(dailyWeighIns([weight(82, 1, 21, 59)], { window: late })).basis).toBe('firstMorning');
  });

  it('with no reading in it, the middle value counts', () => {
    const day = only(dailyWeighIns([weight(82, 1, 6, 0), weight(83, 1, 8, 0)], { window: late }));
    expect(day.basis).toBe('medianOfDay');
    expect(day.kg).toBe(82.5);
  });

  it('a reading counts for the day it was taken on: the window never crosses midnight', () => {
    const toMidnight = new WeighInWindow({ startMinute: 20 * 60, endMinute: 24 * 60 });
    const days = dailyWeighIns([weight(82, 1, 23, 50), weight(83, 2, 0, 10)], { window: toMidnight });
    expect(days.map((d) => [d.day.getDate(), d.basis])).toEqual([
      [1, 'firstMorning'],
      [2, 'medianOfDay'],
    ]);
    expect(() => new WeighInWindow({ startMinute: 22 * 60, endMinute: 6 * 60 })).toThrow(ArgumentError);
    expect(() => new WeighInWindow({ startMinute: 0, endMinute: 24 * 60 + 1 })).toThrow(ArgumentError);
    expect(() => new WeighInWindow({ startMinute: 600, endMinute: 600 })).toThrow(ArgumentError);
    expect(() => new WeighInWindow({ startMinute: 0.5, endMinute: 600 })).toThrow(ArgumentError);
  });
});
