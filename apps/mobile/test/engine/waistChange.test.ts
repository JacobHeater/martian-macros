import { describe, expect, it } from 'vitest';
import { CalendarDate, WaistObservation } from '../../src/domain';
import { middleReading, waistChangeOf, waistNoiseOf, WaistRule } from '../../src/engine';
import { ArgumentError } from '../../src/lang/ArgumentError';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-155: one answer to "has the waist changed over this period?". */
const today = CalendarDate.of(2026, 10, 11);

/** Entries given as [days ago, centimetres]. */
type Entries = readonly (readonly [daysAgo: number, cm: number])[];

const on = (entries: Entries) =>
  entries.map(([daysAgo, cm]) => new WaistObservation({ date: today.addDays(-daysAgo), waistCm: cm }));

const over = (entries: Entries, { days = 28, noiseCm }: { days?: number; noiseCm?: number } = {}) =>
  waistChangeOf({ waist: on(entries), asOf: today, days, noiseCm });

describe('over a period', () => {
  it('92.0 four weeks ago and 91.2 now is no clear change', () => {
    const change = over([
      [35, 92],
      [28, 92],
      [21, 92],
      [14, 91.2],
      [7, 91.2],
      [0, 91.2],
    ]);
    expect(change?.direction).toBe('noClearChange');
    expectClose(change?.changeCm, -0.8, 1e-9);
    expectClose(change?.thresholdCm, 1.4, 1e-9);
  });

  it('92.0 eight weeks ago and 89.5 now is down 2.5', () => {
    const change = over(
      [
        [63, 92],
        [56, 92],
        [49, 92],
        [14, 89.5],
        [7, 89.5],
        [0, 89.5],
      ],
      { days: 56 },
    );
    expect(change?.direction).toBe('down');
    expectClose(change?.changeCm, -2.5, 1e-9);
    expect(change?.fromCm).toBe(92);
    expect(change?.toCm).toBe(89.5);
  });

  it('up is reported as up', () => {
    expect(
      over([
        [28, 90],
        [7, 92],
        [0, 92],
      ])?.direction,
    ).toBe('up');
  });

  it('each end is the middle of up to three entries, so one odd reading does not decide it', () => {
    // Now: 90, 93.5 (a bloated morning), 90. Then: 92, 92, 89 (a slip).
    const change = over([
      [35, 92],
      [28, 92],
      [22, 89],
      [14, 90],
      [7, 93.5],
      [0, 90],
    ]);
    expect(change?.fromCm).toBe(92);
    expect(change?.toCm).toBe(90);
    expect(change?.recentEntries).toBe(3);
    expect(change?.baselineEntries).toBe(3);
    expect(change?.direction).toBe('down');
  });

  it('a change of exactly the threshold counts, and a hair less does not', () => {
    expect(
      over([
        [28, 92],
        [0, 90.6],
      ])?.direction,
    ).toBe('down');
    expect(
      over([
        [28, 92],
        [0, 90.61],
      ])?.direction,
    ).toBe('noClearChange');
  });

  it('single readings are noisier: the same difference is not a change', () => {
    const entries: Entries = [
      [28, 92.0],
      [0, 90.2],
    ];
    expect(over(entries)?.direction).toBe('down');
    const single = over(entries, { noiseCm: WaistRule.singleReadingNoiseCm });
    expect(single?.direction).toBe('noClearChange');
    expectClose(single?.thresholdCm, 2.1, 1e-9);
  });

  it('nothing in the last two weeks: there is no now to compare', () => {
    expect(
      over([
        [28, 92],
        [14, 90],
      ]),
    ).toBeUndefined();
    expect(
      over([
        [28, 92],
        [13, 90],
      ]),
    ).toBeDefined();
  });

  it('nothing near the day compared with: there is no then', () => {
    expect(
      over([
        [60, 92],
        [0, 90],
      ]),
    ).toBeUndefined();
    expect(
      over([
        [38, 92],
        [0, 90],
      ]),
    ).toBeDefined();
    expect(
      over([
        [39, 92],
        [0, 90],
      ]),
    ).toBeUndefined();
  });

  it('an entry is never at both ends', () => {
    // Three weekly entries and nothing older: all three are "now".
    expect(
      over(
        [
          [14, 92],
          [7, 91],
          [0, 90],
        ],
        { days: 14 },
      ),
    ).toBeUndefined();
    // The fourth, older than the three, is "then".
    const change = over(
      [
        [21, 92],
        [14, 91],
        [7, 90.5],
        [0, 90],
      ],
      { days: 21 },
    );
    expect(change?.fromCm).toBe(92);
    expect(change?.toCm).toBe(90.5);
  });

  it('entries after the day asked about are not used', () => {
    const change = waistChangeOf({
      waist: on([
        [35, 92],
        [28, 92],
        [7, 91.9],
        [0, 80],
      ]),
      asOf: today.addDays(-7),
      days: 21,
    });
    expect(change?.toCm).toBe(91.9);
  });

  it('no entries is no answer', () => {
    expect(over([])).toBeUndefined();
  });
});

describe('the noise figure', () => {
  const triple = (daysAgo: number, middle: number, spread: number) =>
    new WaistObservation({
      date: today.addDays(-daysAgo),
      waistCm: middle,
      readings: [middle - spread / 2, middle + spread / 2, middle],
    });

  it('is 1.0 cm until eight entries carry their three readings', () => {
    expect(waistNoiseOf([])).toBe(1.0);
    expect(waistNoiseOf(upTo(7).map((i) => triple(i * 7, 92, 0.6)))).toBe(1.0);
    // Entries without readings, and single readings, say nothing about
    // the spread of a sitting.
    expect(
      waistNoiseOf([
        ...on(upTo(20).map((i) => [i * 7, 92] as const)),
        ...upTo(10).map((i) => new WaistObservation({ date: today.addDays(-i), waistCm: 92, readings: [92] })),
      ]),
    ).toBe(1.0);
  });

  it("is then the user's own: readings that typically span 0.6 cm give 0.6", () => {
    const ten = upTo(10).map((i) => triple(i * 7, 92, 0.6));
    expectClose(waistNoiseOf(ten), 0.6, 1e-9);
  });

  it('is never taken to be under half a centimeter', () => {
    const steady = upTo(10).map((i) => triple(i * 7, 92, 0.2));
    expect(waistNoiseOf(steady)).toBe(0.5);
  });

  it('is the typical spread, so one wild sitting does not set it', () => {
    const entries = [...upTo(9).map((i) => triple(i * 7, 92, 0.8)), triple(70, 92, 6)];
    expectClose(waistNoiseOf(entries), 0.8, 1e-9);
  });

  it('a careful measurer has smaller changes reported', () => {
    // Ten weekly sittings spanning 0.6 cm, the last three a centimeter
    // down on the three of four weeks before.
    const entries = upTo(10).map((i) => triple(i * 7, i < 3 ? 91.0 : 92.0, 0.6));
    const change = waistChangeOf({ waist: entries, asOf: today });
    expectClose(change?.thresholdCm, 1.4 * 0.6, 1e-9);
    expectClose(change?.changeCm, -1, 1e-9);
    expect(change?.direction).toBe('down');
    // The same figures with no readings kept: at the default, not a
    // change.
    const plain = on(upTo(10).map((i) => [i * 7, i < 3 ? 91.0 : 92.0] as const));
    expect(waistChangeOf({ waist: plain, asOf: today })?.direction).toBe('noClearChange');
  });

  it('a single reading at either end widens it by half', () => {
    const entries = [
      new WaistObservation({ date: today.addDays(-28), waistCm: 92, readings: [91.5, 92.5, 92] }),
      new WaistObservation({ date: today, waistCm: 90.2, readings: [90.2] }),
    ];
    const change = waistChangeOf({ waist: entries, asOf: today });
    expectClose(change?.thresholdCm, 2.1, 1e-9);
    expect(change?.direction).toBe('noClearChange');
  });
});

describe('the middle reading', () => {
  it('is the middle of three, whatever the order', () => {
    expect(middleReading([91.5, 92.5, 92.0])).toBe(92.0);
    expect(middleReading([94, 92, 92.5])).toBe(92.5);
    expect(middleReading([92, 92, 95])).toBe(92);
  });

  it('of one reading is that reading', () => {
    expect(middleReading([92.4])).toBe(92.4);
  });

  it('is not taken of two, or of none', () => {
    expect(() => middleReading([92, 93])).toThrow(ArgumentError);
    expect(() => middleReading([])).toThrow(ArgumentError);
  });
});

describe('since the start', () => {
  const sinceStart = (entries: Entries) => waistChangeOf({ waist: on(entries), asOf: today, sinceStart: true });

  it('the start is the middle of the first three entries, not the first', () => {
    const change = sinceStart([
      [70, 94],
      [63, 92],
      [56, 92.5],
      [14, 90],
      [7, 90],
      [0, 90],
    ]);
    expect(change?.fromCm).toBe(92.5);
    expectClose(change?.changeCm, -2.5, 1e-9);
    expect(change?.direction).toBe('down');
  });

  it('with few entries no entry is at both ends', () => {
    expect(sinceStart([[0, 90]])).toBeUndefined();
    const two = sinceStart([
      [14, 92],
      [0, 90],
    ]);
    expect(two?.baselineEntries).toBe(1);
    expect(two?.recentEntries).toBe(1);
    const five = sinceStart([
      [28, 93],
      [21, 92],
      [14, 91],
      [7, 90],
      [0, 89],
    ]);
    expect(five?.baselineEntries).toBe(2);
    expect(five?.recentEntries).toBe(3);
    expect(five?.fromCm).toBe(92.5);
    expect(five?.toCm).toBe(90);
  });

  it('it still needs a measurement from the last two weeks', () => {
    expect(
      sinceStart([
        [60, 94],
        [50, 92],
        [20, 90],
      ]),
    ).toBeUndefined();
  });
});
