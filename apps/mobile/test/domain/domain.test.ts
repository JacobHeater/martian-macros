import { describe, expect, it } from 'vitest';
import {
  BiologicalSex,
  CalendarDate,
  CoachingPolicy,
  dailyRelativeSigma,
  GoalMode,
  Profile,
  QuantitySource,
  ScreeningAnswers,
} from '../../src/domain';
import { ArgumentError } from '../../src/lang/ArgumentError';
import { FormatError } from '../../src/lang/FormatError';
import { expectClose } from '../support/expectClose';

describe('BiologicalSex', () => {
  it('round-trips persisted names', () => {
    for (const sex of BiologicalSex.values) {
      expect(BiologicalSex.parse(sex)).toBe(sex);
    }
  });

  it('rejects anything outside the binary instead of defaulting', () => {
    for (const bad of ['', 'other', 'notSet', 'Male', 'unknown']) {
      expect(() => BiologicalSex.parse(bad)).toThrow(FormatError);
    }
  });
});

describe('CalendarDate', () => {
  it('parses, prints, and does day arithmetic', () => {
    const d = CalendarDate.parse('2024-02-28');
    expect(d.addDays(1).toString()).toBe('2024-02-29');
    expect(d.addDays(2).toString()).toBe('2024-03-01');
    expect(d.daysUntil(CalendarDate.of(2024, 3, 28))).toBe(29);
  });

  it('rejects impossible dates', () => {
    expect(() => CalendarDate.of(2023, 2, 29)).toThrow(ArgumentError);
    expect(() => CalendarDate.parse('2023-13-01')).toThrow(ArgumentError);
  });

  it('ignores time of day and timezone flag', () => {
    expect(CalendarDate.fromDate(new Date(2026, 2, 8, 23, 59))).toBe(CalendarDate.of(2026, 3, 8));
  });

  // Not in the Dart tests: in Dart two dates for one day were equal by
  // value. Here they are one object, which the rest of the port relies on.
  it('is one object per day, so days compare with === and work as keys', () => {
    expect(CalendarDate.of(2026, 3, 8)).toBe(CalendarDate.parse('2026-03-08'));
    expect(CalendarDate.of(2026, 3, 8).addDays(1)).toBe(CalendarDate.of(2026, 3, 9));
    const seen = new Set([CalendarDate.of(2026, 3, 8)]);
    expect(seen.has(CalendarDate.fromEpochDay(CalendarDate.of(2026, 3, 8).epochDay))).toBe(true);
  });

  it('knows the year, month and day before 1970 and in a leap year', () => {
    const early = CalendarDate.of(1960, 2, 29);
    expect([early.year, early.month, early.day]).toEqual([1960, 2, 29]);
    expect(early.epochDay).toBeLessThan(0);
    expect(early.toString()).toBe('1960-02-29');
  });
});

describe('Profile', () => {
  const profile = new Profile({ sex: 'female', birthDate: CalendarDate.of(2008, 6, 15), heightCm: 165 });

  it('computes completed years of age', () => {
    expect(profile.ageOn(CalendarDate.of(2026, 6, 14))).toBe(17);
    expect(profile.ageOn(CalendarDate.of(2026, 6, 15))).toBe(18);
  });

  it('rejects implausible height', () => {
    expect(() => new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 18 })).toThrow(
      ArgumentError,
    );
  });
});

it('an Estimate is 40% uncertain, a weighed entry 5% (MM-167, MM-150)', () => {
  expect(QuantitySource.relativeSigma('quickAdd')).toBe(0.4);
  expect(QuantitySource.relativeSigma('weighed')).toBe(0.05);
});

describe('dailyRelativeSigma', () => {
  it('combines entry errors in quadrature', () => {
    const sigma = dailyRelativeSigma([
      [500, 'weighed'],
      [500, 'palm'],
    ]);
    // sqrt(25^2 + 125^2) / 1000
    expectClose(sigma, 0.1275, 1e-4);
  });

  it('is zero for an empty day', () => {
    expect(dailyRelativeSigma([])).toBe(0);
  });
});

describe('CoachingPolicy', () => {
  const adult = (sex: BiologicalSex) => new Profile({ sex, birthDate: CalendarDate.of(1990, 1, 1), heightCm: 170 });
  const today = CalendarDate.of(2026, 10, 5);

  it('blocks minors entirely', () => {
    const policy = CoachingPolicy.derive({
      profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(2010, 1, 1), heightCm: 170 }),
      screening: new ScreeningAnswers(),
      today,
    });
    expect(policy.blocked).toBe(true);
    expect(policy.allowedModes.size).toBe(0);
  });

  it('allows every mode with no flags', () => {
    const policy = CoachingPolicy.derive({ profile: adult('male'), screening: new ScreeningAnswers(), today });
    expect(policy.allowedModes).toEqual(new Set(GoalMode.values));
  });

  it('locks pregnancy and lactation to maintenance', () => {
    for (const s of [new ScreeningAnswers({ pregnant: true }), new ScreeningAnswers({ breastfeeding: true })]) {
      const policy = CoachingPolicy.derive({ profile: adult('female'), screening: s, today });
      expect(policy.allowedModes).toEqual(new Set(['maintenance']));
    }
  });

  it('adds lactation energy and caps protein for kidney disease', () => {
    const policy = CoachingPolicy.derive({
      profile: adult('female'),
      screening: new ScreeningAnswers({ breastfeeding: true, chronicKidneyDisease: true }),
      today,
    });
    expect(policy.maintenanceOffsetKcal).toBe(400);
    expect(policy.proteinCapGPerKg).toBe(0.8);
  });

  it('removes deficit modes after an eating disorder', () => {
    const policy = CoachingPolicy.derive({
      profile: adult('male'),
      screening: new ScreeningAnswers({ eatingDisorderHistory: true }),
      today,
    });
    expect(policy.allowedModes).toEqual(new Set(['maintenance', 'leanGain']));
    expect(policy.suppressWeightRewards).toBe(true);
  });

  it('rejects female-only answers on a male profile', () => {
    expect(() =>
      CoachingPolicy.derive({ profile: adult('male'), screening: new ScreeningAnswers({ pregnant: true }), today }),
    ).toThrow(ArgumentError);
  });
});
