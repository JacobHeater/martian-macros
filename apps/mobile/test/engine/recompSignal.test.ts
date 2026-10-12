import { describe, expect, it } from 'vitest';
import { CalendarDate, Exercise, WaistObservation, type WeightObservation } from '../../src/domain';
import { recompSignalOf, type StrengthPoint, StrengthTrend, WeightTrendPoint } from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';
import { squat } from './support/squat';

/** MM-32: whether four weeks look like a recomp from outside. */
const today = CalendarDate.of(2026, 10, 11);

/** A trend from `fromKg` 28 days ago to `toKg` today, a point a day. */
function trend(fromKg: number, toKg: number): WeightTrendPoint[] {
  const points: WeightTrendPoint[] = [];
  for (let daysAgo = 40; daysAgo >= 0; daysAgo--) {
    points.push(
      new WeightTrendPoint({
        date: today.addDays(-daysAgo),
        levelKg: daysAgo >= 28 ? fromKg : fromKg + ((toKg - fromKg) * (28 - daysAgo)) / 28,
        slopeKgPerDay: 0,
        waterKg: 0,
        levelVariance: 0.04,
        slopeVariance: 0.0001,
        observed: true,
        rejected: false,
      }),
    );
  }
  return points;
}

const weighedOn = (daysAgo: readonly number[]): WeightObservation[] =>
  daysAgo.map((d) => ({ date: today.addDays(-d), weightKg: 82 }));

/** The whole numbers from `from` to `to`, both included. */
const span = (from: number, to: number) => upTo(to - from + 1).map((i) => from + i);

const daily = weighedOn(span(0, 35));

const waistOn = (entries: readonly (readonly [daysAgo: number, cm: number])[]) =>
  entries.map(([daysAgo, cm]) => new WaistObservation({ date: today.addDays(-daysAgo), waistCm: cm }));

/**
 * A lift trained weekly, its smoothed max going from `fromKg` 28 days
 * before its last session to `toKg` at it.
 */
function lift(
  name: string,
  fromKg: number,
  toKg: number,
  { lastDaysAgo = 1, sessions = 6 }: { lastDaysAgo?: number; sessions?: number } = {},
): StrengthTrend {
  const points: StrengthPoint[] = [];
  for (let i = sessions - 1; i >= 0; i--) {
    const kg = i >= 4 ? fromKg : fromKg + ((toKg - fromKg) * (4 - i)) / 4;
    points.push({ workoutId: i + 1, date: today.addDays(-lastDaysAgo - i * 7), estimateKg: kg, trendKg: kg });
  }
  return new StrengthTrend({
    exercise: new Exercise({ id: name, name, equipment: squat.equipment, primary: squat.primary }),
    exerciseId: name,
    loggedSessions: sessions,
    recentSessions: sessions,
    points,
  });
}

const waistDown = waistOn([
  [30, 92],
  [24, 92.5],
  [10, 90.5],
  [3, 90],
]);
const liftsUp = [lift('Back squat', 100, 106), lift('Barbell row', 60, 63)];

const read = ({
  trendPoints,
  weights,
  waist,
  lifts,
}: {
  trendPoints?: WeightTrendPoint[];
  weights?: WeightObservation[];
  waist?: WaistObservation[];
  lifts?: StrengthTrend[];
} = {}) =>
  recompSignalOf({
    trend: trendPoints ?? trend(82, 82.2),
    weights: weights ?? daily,
    waist: waist ?? waistDown,
    strengthTrends: lifts ?? liftsUp,
    today,
  });

it('weight flat, waist down and two lifts up: the signal is there', () => {
  const signal = read();
  expect(signal.present).toBe(true);
  expect(signal.onlyMissing).toBeUndefined();
  expectClose(signal.trendWeightKg, 82.2, 1e-9);
  expectClose(signal.waistChangeCm, -2, 1e-9);
  expect(signal.liftsUp).toEqual(['Back squat', 'Barbell row']);
});

describe('weight', () => {
  it('down 2% is not flat: that is fat loss, and no signal', () => {
    const signal = read({ trendPoints: trend(82, 80.36) });
    expect(signal.weight).toBe('doesNotHold');
    expect(signal.present).toBe(false);
    expect(signal.onlyMissing).toBeUndefined();
  });

  it('moved by exactly half a percent is not flat', () => {
    expect(read({ trendPoints: trend(80, 80.4) }).weight).toBe('doesNotHold');
    expect(read({ trendPoints: trend(80, 80.39) }).weight).toBe('holds');
  });

  it('is unknown on six weigh-ins in four weeks', () => {
    const signal = read({ weights: weighedOn([0, 1, 9, 17, 27, 29]) });
    expect(signal.weight).toBe('unknown');
    expect(signal.onlyMissing).toBe('weight');
  });

  it('is unknown with none in the last week, or none four weeks ago', () => {
    expect(read({ weights: weighedOn(span(8, 35)) }).weight).toBe('unknown');
    expect(read({ weights: weighedOn(span(0, 20)) }).weight).toBe('unknown');
  });
});

describe('waist', () => {
  it('down 1.25 cm between two pairs is not clearly down', () => {
    const signal = read({
      waist: waistOn([
        [30, 92],
        [24, 93],
        [10, 91],
        [3, 91.5],
      ]),
    });
    expect(signal.waist).toBe('doesNotHold');
    expectClose(signal.waistChangeCm, -1.25, 1e-9);
    expect(signal.present).toBe(false);
  });

  it('down 1.5 cm between two pairs is down', () => {
    expect(
      read({
        waist: waistOn([
          [30, 92],
          [24, 93],
          [10, 91],
          [3, 91],
        ]),
      }).waist,
    ).toBe('holds');
  });

  it('it is the shared answer: down by the noise of a difference', () => {
    expect(
      read({
        waist: waistOn([
          [28, 92],
          [10, 90.7],
          [3, 90.7],
        ]),
      }).waist,
    ).toBe('doesNotHold');
    expect(
      read({
        waist: waistOn([
          [28, 92],
          [10, 90.6],
          [3, 90.6],
        ]),
      }).waist,
    ).toBe('holds');
  });

  it('up is not a prompt to measure: it was measured', () => {
    const signal = read({
      waist: waistOn([
        [30, 90],
        [24, 90],
        [10, 92],
        [3, 92],
      ]),
    });
    expect(signal.waist).toBe('doesNotHold');
    expect(signal.onlyMissing).toBeUndefined();
  });

  it('is unknown with no entries, or two, or none at one end', () => {
    expect(read({ waist: [] }).waist).toBe('unknown');
    expect(read({ waist: [] }).onlyMissing).toBe('waist');
    expect(
      read({
        waist: waistOn([
          [28, 92],
          [3, 90],
        ]),
      }).waist,
    ).toBe('unknown');
    expect(
      read({
        waist: waistOn([
          [12, 92],
          [8, 91],
          [3, 90],
        ]),
      }).waist,
    ).toBe('unknown');
  });

  it('it needs a measurement from the last two weeks, and one from about four weeks ago', () => {
    expect(
      read({
        waist: waistOn([
          [35, 92],
          [24, 92],
          [13, 90],
        ]),
      }).waist,
    ).toBe('holds');
    // Nothing for two weeks: now is not known.
    expect(
      read({
        waist: waistOn([
          [35, 92],
          [24, 92],
          [14, 90],
        ]),
      }).waist,
    ).toBe('unknown');
    // Nothing within ten days of four weeks ago.
    expect(
      read({
        waist: waistOn([
          [60, 92],
          [50, 92],
          [10, 90],
          [3, 90],
        ]),
      }).waist,
    ).toBe('unknown');
  });
});

describe('strength', () => {
  it('one lift up is not enough', () => {
    const signal = read({ lifts: [lift('Back squat', 100, 106), lift('Barbell row', 60, 60.5)] });
    expect(signal.strength).toBe('doesNotHold');
    expect(signal.present).toBe(false);
  });

  it('up by exactly 2.5% counts, and less does not', () => {
    expect(read({ lifts: [lift('Back squat', 100, 102.5), lift('Barbell row', 80, 82)] }).strength).toBe('holds');
    expect(read({ lifts: [lift('Back squat', 100, 102.4), lift('Barbell row', 80, 82)] }).strength).toBe(
      'doesNotHold',
    );
  });

  it('two up and two down is not up', () => {
    expect(
      read({
        lifts: [
          lift('Back squat', 100, 106),
          lift('Barbell row', 60, 63),
          lift('Bench', 80, 76),
          lift('Press', 50, 47),
        ],
      }).strength,
    ).toBe('doesNotHold');
  });

  it('a lift not trained for 20 days is not counted', () => {
    const signal = read({
      lifts: [lift('Back squat', 100, 106), lift('Barbell row', 60, 63, { lastDaysAgo: 20 })],
    });
    expect(signal.strength).toBe('unknown');
    expect(signal.onlyMissing).toBe('strength');
  });

  it('a lift with three sessions in six weeks is not counted', () => {
    expect(
      read({ lifts: [lift('Back squat', 100, 106), lift('Barbell row', 60, 63, { sessions: 3 })] }).strength,
    ).toBe('unknown');
  });

  it('is unknown with no training logged', () => {
    const signal = read({ lifts: [] });
    expect(signal.strength).toBe('unknown');
    expect(signal.onlyMissing).toBe('strength');
  });
});

it('two parts unknown is nothing to prompt for', () => {
  expect(read({ waist: [], lifts: [] }).onlyMissing).toBeUndefined();
});
