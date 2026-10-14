import { describe, expect, it } from 'vitest';
import { CalendarDate, Caution, MealKind, MealSize, WaistObservation, WeightEventType } from '../../src/domain';
import { DailyTargets, ModeReason, TargetFlag, TargetsRecord } from '../../src/engine';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { cautionMessage } from '../../src/format/cautionMessage';
import { coachLineText } from '../../src/format/coachLineText';
import { Fmt } from '../../src/format/Fmt';
import { mealKindLabel } from '../../src/format/mealKindLabel';
import { mealKindShortLabel } from '../../src/format/mealKindShortLabel';
import { mealSizeLabel } from '../../src/format/mealSizeLabel';
import { modeReasonExplanation } from '../../src/format/modeReasonExplanation';
import { targetFlagMessage } from '../../src/format/targetFlagMessage';
import { waistSummary } from '../../src/format/waistSummary';
import { weightEventLabel } from '../../src/format/weightEventLabel';
import dart from './support/dartMessages.json';

/**
 * MM-230: the messages the Flutter app kept beside its screens.
 * `dartMessages.json` is what the Dart printed on 2026-10-12 for every
 * caution, target flag, reason for a goal, weight event and estimated meal,
 * and for six waist histories in both unit systems.
 */
describe('every message of every kind, as Dart printed it', () => {
  const all = <T extends string>(values: readonly T[], message: (value: T) => string) =>
    Object.fromEntries(values.map((value) => [value, message(value)]));

  it.each([
    ['caution', all(Caution.values, cautionMessage)],
    ['targetFlag', all(TargetFlag.values, targetFlagMessage)],
    ['modeReason', all(ModeReason.values, modeReasonExplanation)],
    ['weightEvent', all(WeightEventType.values, weightEventLabel)],
    ['mealSize', all(MealSize.values, mealSizeLabel)],
    ['mealKind', all(MealKind.values, mealKindLabel)],
    ['mealKindShort', all(MealKind.values, mealKindShortLabel)],
  ] as const)('%s', (kind, ours) => {
    expect(ours).toEqual(dart.labels[kind]);
  });
});

describe('the waist card’s line, as Dart printed it', () => {
  const today = CalendarDate.fromEpochDay(dart.today);

  it.each(Object.entries(dart.waist))('%s', (_, recorded) => {
    const waist = recorded.entries.map(
      (entry) => new WaistObservation({ date: CalendarDate.fromEpochDay(entry[0] as number), waistCm: entry[1] as number }),
    );
    expect(waistSummary(waist, new Fmt('metric'), today)).toBe(recorded.metric);
    expect(waistSummary(waist, new Fmt('imperial'), today)).toBe(recorded.imperial);
  });
});

// Added in the move: Flutter tested this line through the dashboard.
describe('the dashboard’s line about the coach', () => {
  const onboardedOn = CalendarDate.of(2026, 9, 1);
  const setup = typicalSetup({ onboardedOn });
  const record = (effectiveFrom: CalendarDate, kcal: number) =>
    new TargetsRecord({
      effectiveFrom,
      mode: 'fatLoss',
      tdeeKcal: 2600,
      tdeeSigmaKcal: 200,
      tdeeStatus: 'updated',
      targets: new DailyTargets({ kcal, proteinG: 160, fatG: 70, carbsG: 200, weeklyRateFraction: -0.005 }),
    });

  it('counts the days of calibration', () => {
    expect(coachLineText({ setup, history: [], today: onboardedOn })).toBe(
      'Calibration, day 1 of 14. Targets hold while the app learns your metabolism.',
    );
    expect(coachLineText({ setup, history: [], today: onboardedOn.addDays(13) })).toBe(
      'Calibration, day 14 of 14. Targets hold while the app learns your metabolism.',
    );
  });

  it('after calibration with no targets yet, says when they arrive', () => {
    expect(coachLineText({ setup, history: [], today: onboardedOn.addDays(14) })).toBe(
      'Targets arrive with your first weigh-in.',
    );
  });

  it('says a change in the last week, and hedges it when the coach is less sure', () => {
    const today = CalendarDate.of(2026, 10, 12);
    const history = [record(today.addDays(-9), 2300), record(today.addDays(-2), 2224.6)];
    expect(coachLineText({ setup, history, today })).toBe('Targets went down 75 kcal on Sat, Oct 10.');
    expect(coachLineText({ setup, history, today, confidence: 'fair' })).toBe(
      'Targets went down about 75 kcal on Sat, Oct 10, so far.',
    );
    const raised = [record(today.addDays(-8), 2300), record(today.addDays(-1), 2350)];
    // MM-283: a near day is said as a word, never "on Yesterday".
    expect(coachLineText({ setup, history: raised, today })).toBe('Targets went up 50 kcal yesterday.');
    const todays = [record(today.addDays(-8), 2300), record(today, 2350)];
    expect(coachLineText({ setup, history: todays, today })).toBe('Targets went up 50 kcal today.');
  });

  it('otherwise says when the next check-in is, or that targets are held while it learns', () => {
    const today = CalendarDate.of(2026, 10, 12);
    const unchanged = [record(today.addDays(-9), 2300), record(today.addDays(-2), 2300.4)];
    expect(coachLineText({ setup, history: unchanged, today })).toBe('Next check-in Sat, Oct 17.');
    expect(coachLineText({ setup, history: unchanged, today, confidence: 'learning' })).toBe(
      'Targets are held while the coach learns from more complete data.',
    );
    const old = [record(today.addDays(-30), 2300), record(today.addDays(-20), 2200)];
    expect(coachLineText({ setup, history: old, today })).toBe('Next check-in Tue, Sep 29.');
  });

  it('the next check-in is never before calibration ends', () => {
    // A week after targets from September 3 would be September 10; calibration ends on the 15th.
    const first = [record(onboardedOn.addDays(2), 2300)];
    expect(coachLineText({ setup, history: first, today: onboardedOn.addDays(14) })).toBe('Next check-in Today.');
    const later = [record(onboardedOn.addDays(10), 2300)];
    expect(coachLineText({ setup, history: later, today: onboardedOn.addDays(14) })).toBe(
      'Next check-in Fri, Sep 18.',
    );
  });
});
