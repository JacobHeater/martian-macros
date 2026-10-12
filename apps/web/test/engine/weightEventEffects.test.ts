import { expect, it } from 'vitest';
import {
  CalendarDate,
  IntakeDay,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightEvent,
  type WeightObservation,
} from '../../src/domain';
import {
  analyze,
  creatineEventShift,
  creatineWeightEvents,
  effectiveWeightEvents,
  passingWeightEventNoise,
  type TrendShift,
  weightEventNoiseMultiplier,
  weightEventStepDays,
  weightEventStepPriorKg,
  WeightTrendModel,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

const start = CalendarDate.of(2026, 1, 1);

it('only two passing events in a rolling 14-day window affect noise', () => {
  const events: WeightEvent[] = [
    { date: start.addDays(14), type: 'largeOrSaltyMeal' },
    { date: start.addDays(13), type: 'newTraining' },
    { date: start.addDays(7), type: 'travel' },
    { date: start, type: 'illness' },
  ];
  expect(effectiveWeightEvents(events).map((event) => event.date)).toEqual([
    start,
    start.addDays(7),
    start.addDays(14),
  ]);
});

it('a third passing event does not change any smoothed trend point', () => {
  const events: WeightEvent[] = [
    { date: start.addDays(15), type: 'travel' },
    { date: start.addDays(19), type: 'illness' },
    { date: start.addDays(24), type: 'newTraining' },
  ];
  const observations: WeightObservation[] = upTo(35).map((day) => ({
    date: start.addDays(day),
    weightKg: 80 + (day % 2 === 0 ? 0.3 : -0.3),
  }));
  const smooth = (given: readonly WeightEvent[]) =>
    new WeightTrendModel().smooth(observations, {
      noiseMultiplier: passingWeightEventNoise(effectiveWeightEvents(given)),
    });
  const firstTwo = smooth(events.slice(0, 2));
  const allThree = smooth(events);
  expect(allThree.map((p) => p.levelKg)).toEqual(firstTwo.map((p) => p.levelKg));
  expect(allThree.map((p) => p.levelVariance)).toEqual(firstTwo.map((p) => p.levelVariance));
});

it('illness noise covers the day before through seven days after', () => {
  const noise = passingWeightEventNoise([{ date: start, type: 'illness' }]);
  expect(noise(start.addDays(-1))).toBe(weightEventNoiseMultiplier);
  expect(noise(start)).toBe(weightEventNoiseMultiplier);
  expect(noise(start.addDays(7))).toBe(weightEventNoiseMultiplier);
  expect(noise(start.addDays(8))).toBe(1);
});

it('other passing-event noise covers the day before through four days after', () => {
  const noise = passingWeightEventNoise([{ date: start, type: 'travel' }]);
  expect(noise(start.addDays(-1))).toBe(weightEventNoiseMultiplier);
  expect(noise(start.addDays(4))).toBe(weightEventNoiseMultiplier);
  expect(noise(start.addDays(5))).toBe(1);
});

it('creatine uses a directional 1.5 kg prior spread across 21 updates', () => {
  const startShift = creatineEventShift([{ date: start, type: 'startedCreatine' }]);
  const shifts = upTo(weightEventStepDays).map((day) => startShift(start.addDays(day)) as TrendShift);
  expectClose(
    shifts.reduce((sum, shift) => sum + shift.levelMeanKg, 0),
    weightEventStepPriorKg,
    1e-9,
  );
  expectClose(
    Math.sqrt(shifts.reduce((sum, shift) => sum + shift.levelSigmaKg * shift.levelSigmaKg, 0)),
    weightEventStepPriorKg,
    1e-9,
  );
  expect(startShift(start.addDays(weightEventStepDays))).toBeUndefined();

  const stopShift = creatineEventShift([{ date: start, type: 'stoppedCreatine' }]);
  expect(stopShift(start)?.levelMeanKg).toBeLessThan(0);
});

it('creatine transition excludes its full settling window from TDEE', () => {
  const weights: WeightObservation[] = upTo(31).map((day) => ({ date: start.addDays(day), weightKg: 80 }));
  const intake = upTo(31).map(
    (day) =>
      new IntakeDay({
        date: start.addDays(day),
        kcal: 2200,
        proteinG: 150,
        carbsG: 250,
        fatG: 70,
        relativeSigma: 0.05,
      }),
  );
  const setup = new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'maintenance',
    onboardedOn: start,
  });
  const snapshot = analyze({
    setup,
    weights,
    intake,
    today: start.addDays(31),
    weightEvents: [{ date: start.addDays(5), type: 'startedCreatine' }],
  });
  expect(snapshot?.tdee.status).toBe('held');
  expect(snapshot?.tdee.settlingUntil).toBe(start.addDays(25));
});

it('a creatine prior follows observed data rather than forcing a jump', () => {
  const event: WeightEvent = { date: start.addDays(15), type: 'startedCreatine' };
  const observations: WeightObservation[] = upTo(42).map((day) => ({ date: start.addDays(day), weightKg: 80 }));
  const lastLevel = (points: readonly { levelKg: number }[]) => points[points.length - 1]?.levelKg as number;
  const plain = lastLevel(new WeightTrendModel().smooth(observations));
  const shifted = lastLevel(new WeightTrendModel().smooth(observations, { shift: creatineEventShift([event]) }));
  expect(Math.abs(shifted - plain)).toBeLessThan(0.5);
});

it('onboarding creatine is deduplicated against an explicit event', () => {
  const event: WeightEvent = { date: start, type: 'startedCreatine' };
  expect(creatineWeightEvents({ events: [event], creatineStartedOn: start })).toHaveLength(1);
});
