import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  DailyActivity,
  DetailLevel,
  Equipment,
  GoalMode,
  Meal,
  MuscleGroup,
  PauseReason,
  PortionUnit,
  QuantitySource,
  RecoveryQuestion,
  ReminderKind,
  ThemePreference,
  TrainingStatus,
} from '../../src/domain';
import { ConfidenceLevel, TimeSpanProblem } from '../../src/engine';
import { PackDownloadProblem, TrustTier } from '../../src/foodCatalog';
import { clockTimeText } from '../../src/format/clockTimeText';
import { confidenceLabel } from '../../src/format/confidenceLabel';
import { dailyActivityDetail } from '../../src/format/dailyActivityDetail';
import { dailyActivityLabel } from '../../src/format/dailyActivityLabel';
import { detailLevelDescription } from '../../src/format/detailLevelDescription';
import { detailLevelLabel } from '../../src/format/detailLevelLabel';
import { elapsedText } from '../../src/format/elapsedText';
import { equipmentLabel } from '../../src/format/equipmentLabel';
import { Fmt } from '../../src/format/Fmt';
import { goalModeBlurb } from '../../src/format/goalModeBlurb';
import { goalModeLabel } from '../../src/format/goalModeLabel';
import { healthDataTypeLabel } from '../../src/format/healthDataTypeLabel';
import { healthDataTypePurpose } from '../../src/format/healthDataTypePurpose';
import { loadNumber } from '../../src/format/loadNumber';
import { mealLabel } from '../../src/format/mealLabel';
import { megabytes } from '../../src/format/megabytes';
import { muscleGroupLabel } from '../../src/format/muscleGroupLabel';
import { paceLabel } from '../../src/format/paceLabel';
import { packDownloadProblemText } from '../../src/format/packDownloadProblemText';
import { parseNumber } from '../../src/format/parseNumber';
import { pauseReasonLabel } from '../../src/format/pauseReasonLabel';
import { portionUnitChipLabel } from '../../src/format/portionUnitChipLabel';
import { portionUnitOf } from '../../src/format/portionUnitOf';
import { quantitySourceLabel } from '../../src/format/quantitySourceLabel';
import { quantityText } from '../../src/format/quantityText';
import { recoveryHighWord } from '../../src/format/recoveryHighWord';
import { recoveryLowWord } from '../../src/format/recoveryLowWord';
import { recoveryQuestionLabel } from '../../src/format/recoveryQuestionLabel';
import { recoveryQuestionText } from '../../src/format/recoveryQuestionText';
import { reminderLabel } from '../../src/format/reminderLabel';
import { reminderPausedLine } from '../../src/format/reminderPausedLine';
import { reminderPrompt } from '../../src/format/reminderPrompt';
import { reminderSentWhen } from '../../src/format/reminderSentWhen';
import { rirText } from '../../src/format/rirText';
import { spokenDuration } from '../../src/format/spokenDuration';
import { themePreferenceLabel } from '../../src/format/themePreferenceLabel';
import { timeSpanProblemMessage } from '../../src/format/timeSpanProblemMessage';
import { trainingStatusLabel } from '../../src/format/trainingStatusLabel';
import { trustTierLabel } from '../../src/format/trustTierLabel';
import { waistAmount } from '../../src/format/waistAmount';
import { HealthDataType } from '../../src/healthIngest';
import { roundHalfAwayFromZero } from '../../src/lang/roundHalfAwayFromZero';
import dart from './support/dartFormats.json';

/**
 * MM-230: what the user reads is what the Flutter app showed.
 * `dartFormats.json` is what the Dart formatters printed for these inputs
 * on 2026-10-12: numbers that round awkwardly, both unit systems, times
 * round the clock, days near and far, and every label of every kind.
 */
const each = <T>(values: readonly number[], format: (value: number) => T) => values.map((value) => format(value));

/** Where the app now knowingly differs from the Flutter app. MM-341: a change that rounds to none carries no sign. */
const unsignedZero = (shown: readonly string[]) => shown.map((text) => text.replace(/^[+−](0\.0+ )/, '$1'));

describe.each([
  ['metric', new Fmt('metric'), dart.metric],
  ['imperial', new Fmt('imperial'), dart.imperial],
] as const)('%s', (_, fmt, recorded) => {
  it('weights, weight changes and lengths', () => {
    expect(each(dart.numbers, (n) => fmt.weight(n))).toEqual(recorded.weight);
    expect(each(dart.numbers, (n) => fmt.weight(n, { decimals: 0 }))).toEqual(recorded.weight0);
    expect(each(dart.numbers, (n) => fmt.weightDelta(n))).toEqual(unsignedZero(recorded.weightDelta));
    expect(each(dart.numbers, (n) => fmt.length(n))).toEqual(recorded.length);
    expect([fmt.weightUnit, fmt.lengthUnit]).toEqual(recorded.unit);
  });

  it('waist changes, to the half centimeter or quarter inch', () => {
    expect(each(dart.numbers, (n) => waistAmount(n, fmt))).toEqual(recorded.waistAmount);
  });

  it('conversions to and from what is stored, to the last digit', () => {
    expect(each(dart.numbers, (n) => fmt.weightFromKg(n))).toEqual(recorded.weightFromKg);
    expect(each(dart.numbers, (n) => fmt.weightToKg(n))).toEqual(recorded.weightToKg);
    expect(each(dart.numbers, (n) => fmt.lengthFromCm(n))).toEqual(recorded.lengthFromCm);
    expect(each(dart.numbers, (n) => fmt.lengthToCm(n))).toEqual(recorded.lengthToCm);
  });
});

it('energy, whole numbers and grams', () => {
  expect(each(dart.numbers, Fmt.kcal)).toEqual(dart.kcal);
  expect(each(dart.numbers, Fmt.whole)).toEqual(dart.whole);
  expect(each(dart.numbers, Fmt.grams)).toEqual(dart.grams);
});

it('paces', () => {
  expect(each(dart.fractions, Fmt.percentPerWeek)).toEqual(dart.percentPerWeek);
  expect(each(dart.fractions, paceLabel)).toEqual(dart.paceLabel);
});

it('loads and amounts as typed back', () => {
  // MM-350: a load is said to a tenth, where the Flutter app said up to two decimals.
  const toATenth = dart.numbers.map((n) => String(roundHalfAwayFromZero((n as number) * 10) / 10 + 0));
  expect(each(dart.numbers, loadNumber)).toEqual(toATenth);
  expect(each(dart.numbers, quantityText)).toEqual(dart.quantityText);
});

it('sizes of files', () => {
  // MM-345: under a tenth of a megabyte the app says kilobytes, where the Flutter app said "0.0 MB".
  const kilobytesBelowATenth = dart.megabytes.map((text, i) => {
    const bytes = dart.bytes[i] as number;
    return bytes < 100000 ? `${Math.round(bytes / 1000)} kB` : text;
  });
  expect(each(dart.bytes, megabytes)).toEqual(kilobytesBelowATenth);
});

it('timers and spoken lengths of time', () => {
  expect(each(dart.seconds, (s) => elapsedText(s * 1000))).toEqual(dart.elapsedText);
  expect(each(dart.seconds, (s) => spokenDuration(s * 1000))).toEqual(dart.spokenDuration);
  expect([elapsedText(1999), spokenDuration(59999)]).toEqual(dart.subSecond);
});

it('times of day', () => {
  const at = (time: readonly number[]) => new Date(2026, 9, 5, time[0], time[1], time[2]);
  expect(dart.times.map((t) => clockTimeText(at(t)))).toEqual(dart.clockTime);
  expect(dart.times.map((t) => clockTimeText(at(t), { seconds: true }))).toEqual(dart.clockTimeSeconds);
});

it('days', () => {
  const today = CalendarDate.of(2026, 10, 12);
  const days = dart.days.map((epochDay) => CalendarDate.fromEpochDay(epochDay));
  expect(days.map((d) => Fmt.day(d, today))).toEqual(dart.day);
  expect(days.map((d) => Fmt.shortDay(d))).toEqual(dart.shortDay);
  expect(days.map((d) => Fmt.longDate(d))).toEqual(dart.longDate);
});

it('typed numbers', () => {
  expect(dart.typed.map((text) => parseNumber(text) ?? null)).toEqual(dart.parseNumber);
});

it('reps in reserve', () => {
  expect([0, 1, 2, 3, 4, 5, 6, 7].map((rir) => rirText(rir))).toEqual(dart.rirText);
});

describe('every label of every kind', () => {
  const all = <T extends string>(values: readonly T[], label: (value: T) => unknown) =>
    Object.fromEntries(values.map((value) => [value, label(value)]));

  it.each([
    ['meal', all(Meal.values, mealLabel)],
    ['pauseReason', all(PauseReason.values, pauseReasonLabel)],
    ['themePreference', all(ThemePreference.values, themePreferenceLabel)],
    ['trainingStatus', all(TrainingStatus.values, trainingStatusLabel)],
    ['trustTier', all(TrustTier.values, trustTierLabel)],
    ['equipment', all(Equipment.values, equipmentLabel)],
    ['timeSpanProblem', all(TimeSpanProblem.values, timeSpanProblemMessage)],
    ['quantitySource', all(QuantitySource.values, quantitySourceLabel)],
    ['detailLevel', all(DetailLevel.values, detailLevelLabel)],
    ['detailLevelDescription', all(DetailLevel.values, detailLevelDescription)],
    ['muscleGroup', all(MuscleGroup.values, muscleGroupLabel)],
    ['goalMode', all(GoalMode.values, goalModeLabel)],
    ['goalModeBlurb', all(GoalMode.values, goalModeBlurb)],
    ['dailyActivity', all(DailyActivity.values, dailyActivityLabel)],
    ['dailyActivityDetail', all(DailyActivity.values, dailyActivityDetail)],
    ['packDownloadProblem', all(PackDownloadProblem.values, packDownloadProblemText)],
    ['healthDataType', all(HealthDataType.values, healthDataTypeLabel)],
    ['healthDataTypePurpose', all(HealthDataType.values, healthDataTypePurpose)],
    ['confidence', all(ConfidenceLevel.values, confidenceLabel)],
    ['reminder', all(ReminderKind.values, reminderLabel)],
    ['reminderSentWhen', all(ReminderKind.values, reminderSentWhen)],
    ['reminderPrompt', all(ReminderKind.values, reminderPrompt)],
    ['reminderPausedLine', all(ReminderKind.values, reminderPausedLine)],
    ['portionUnitChip', all(PortionUnit.values, portionUnitChipLabel)],
    ['portionUnitOf', all(PortionUnit.values, (unit) => dart.quantities.map((q) => portionUnitOf(unit, q)))],
    ['recoveryLabel', all(RecoveryQuestion.values, recoveryQuestionLabel)],
    ['recoveryQuestion', all(RecoveryQuestion.values, recoveryQuestionText)],
    ['recoveryLowWord', all(RecoveryQuestion.values, recoveryLowWord)],
    ['recoveryHighWord', all(RecoveryQuestion.values, recoveryHighWord)],
  ] as const)('%s', (kind, ours) => {
    expect(ours).toEqual(dart.labels[kind]);
  });

  it('none of the recorded kinds is left out', () => {
    expect(Object.keys(dart.labels).length).toBe(29);
  });
});
