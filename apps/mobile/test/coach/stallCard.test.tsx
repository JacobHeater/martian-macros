import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { StallAssessment } from '../../src/engine/StallAssessment';
import type { StallDiagnosis } from '../../src/engine/StallDiagnosis';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { Fmt } from '../../src/format/Fmt';
import { stallText } from '../../src/format/stallText';
import { foodOn } from '../support/foodOn';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-140: what the coach says about a stall. Carried over from stall_card_test.dart. */
const fmt = new Fmt('metric');

const stall = (
  diagnosis: StallDiagnosis,
  {
    gaining = false,
    intake = 2100,
    waist,
    event = false,
    change,
    atFloor = false,
    low = false,
    stepsNow,
    stepsBefore,
  }: {
    gaining?: boolean;
    intake?: number;
    waist?: number;
    event?: boolean;
    change?: number;
    atFloor?: boolean;
    low?: boolean;
    stepsNow?: number;
    stepsBefore?: number;
  } = {},
) =>
  new StallAssessment({
    status: 'stalled',
    windowDays: 21,
    diagnosis,
    gaining,
    usableFoodDays: 7,
    weighIns: 12,
    averageIntakeKcal: intake,
    averageTargetKcal: 2100,
    waistChangeCm: waist,
    maskedByEvent: event,
    expectedChangeKcal: change,
    atFloor,
    estimateLow: low,
    stepsNowPerDay: stepsNow,
    stepsBeforePerDay: stepsBefore,
  });

const every = [
  stall('data'),
  stall('masked', { waist: -2 }),
  stall('masked', { event: true }),
  stall('intake', { intake: 2350 }),
  stall('intake', { intake: 1850, gaining: true }),
  stall('activity', { stepsNow: 5200, stepsBefore: 8100 }),
  stall('estimate', { change: -100 }),
  stall('estimate'),
  stall('estimate', { atFloor: true }),
  stall('estimate', { change: -100, low: true }),
  stall('estimate', { change: 100, gaining: true }),
];

it('thin data says what would help', () => {
  const [body, options] = stallText(stall('data'), fmt);
  expect(body).toContain('7 fully logged days and 12 weigh-ins');
  expect(body).toContain('12 logged days and 10 weigh-ins');
  expect(options).toEqual([]);
});

it('masked states the waist and changes nothing', () => {
  const [body] = stallText(stall('masked', { waist: -2 }), fmt);
  expect(body).toBe(
    'Your waist is down 2.0 cm while the scale held. That is usually fat loss hidden by water. Nothing to change.',
  );
});

it('intake states both figures and offers options', () => {
  const [body, options] = stallText(stall('intake', { intake: 2350 }), fmt);
  expect(body).toContain('about 2,350 against a target of 2,100');
  expect(body).toContain('At 2,350 the app would expect roughly the pace');
  expect(options).toHaveLength(2);
  expect(options[0]).toBe('Keep the target');
});

// MM-678: moving less is said with both averages and the steps ordered back, before anything about the estimate.
it('moving less states both averages of steps and orders them back', () => {
  const [body, options] = stallText(stall('activity', { stepsNow: 5200, stepsBefore: 8100 }), fmt);
  expect(body).toContain('about 5,200 a day over the last 21 days against about 8,100 a day in the 4 weeks before');
  expect(body).toContain('Get the steps back to 8,100');
  expect(body).not.toContain('estimated');
  expect(options).toEqual([]);
});

it('the estimate diagnosis gives the size of the coming change', () => {
  const [body, options] = stallText(stall('estimate', { change: -100 }), fmt);
  expect(body).toContain('lower than estimated');
  expect(body).toContain('comes down by about 100 at the next check-in');
  expect(options).toEqual([]);
});

it('at the floor it offers a break or walking, not a reduction', () => {
  const [body, options] = stallText(stall('estimate', { atFloor: true }), fmt);
  expect(body).toContain('will not come down');
  expect(body).not.toContain('comes down by');
  expect(options).toEqual(['Take a break at maintenance for a week or two', 'Add some daily walking']);
});

it('missing food is raised only when the estimate is very low', () => {
  const [low] = stallText(stall('estimate', { change: -100, low: true }), fmt);
  expect(low).toContain('oils, drinks, sauces, tastes while cooking');
  for (const a of every.filter((a) => !a.estimateLow)) expect(stallText(a, fmt)[0]).not.toContain('into the log');
});

it('no diagnosis accuses, moralizes or instructs', () => {
  for (const a of every) {
    const [body, options] = stallText(a, fmt);
    const all = `${body} ${options.join(' ')}`.toLowerCase();
    for (const word of [
      'cheat',
      'slip',
      'honest',
      'accurate',
      'good',
      'bad',
      'fail',
      'should',
      'must',
      'burn',
      'exercise',
      'plateau',
    ]) {
      expect(all, `${word} in "${all}"`).not.toContain(word);
    }
  }
});

it('a flat month on target shows the card on the Coach screen', async () => {
  const today = CalendarDate.of(2026, 10, 5);
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-70), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-60), {
      kcal: 2100,
      proteinG: 160,
      proteinMinimumG: 130,
      carbsG: 220,
      tdeeSigmaKcal: 150,
      tdeeStatus: 'updated',
    }),
  );
  for (let i = 0; i <= 50; i++) {
    const day = today.addDays(-i);
    await repos.weights.saveWeight(day, 82);
    if (i === 0) continue;
    await repos.food.addFood(foodOn(day, { name: 'Food', kcal: 2100, proteinG: 150, carbsG: 220, fatG: 70 }));
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
  renderApp(repos, today);
  await openCoach();
  const title = await screen.findByRole('heading', { name: 'Progress has slowed' });
  expect(title.closest('.mm-section')).toHaveTextContent('your weight has held');
});
