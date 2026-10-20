import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { workoutOn } from '../support/workoutOn';

/** MM-142: when the scale jumps, the Dashboard says what probably did it, under the weigh-in. */
const today = CalendarDate.of(2026, 10, 20);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/** Forty flat days at 82 kg, logged whole at 230 g of carbohydrate, weighed every day but today. */
async function seed({ screening = new ScreeningAnswers(), yesterdaysCarbs = 230 }: { screening?: ScreeningAnswers; yesterdaysCarbs?: number } = {}) {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today, screening }).copyWith({ unitSystem: 'metric' }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-40), { kcal: 2200 }));
  for (let daysAgo = 40; daysAgo >= 1; daysAgo--) {
    await repos.weights.saveWeight(today.addDays(-daysAgo), 82 + (daysAgo % 2 === 0 ? 0.1 : -0.1));
    const day = today.addDays(-daysAgo);
    await repos.food.addFood(foodOn(day, { kcal: 2200, carbsG: daysAgo === 1 ? yesterdaysCarbs : 230 }));
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
}

async function weighIn(text: string) {
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), `${text}{Enter}`);
  await screen.findByText(/^Trend [\d.]+ kg$/);
}

it('a reading well above the trend after a high-carbohydrate day and a workout is explained under the row, both figures given', async () => {
  await seed({ yesterdaysCarbs: 340 });
  await repos.workouts.saveWorkout(workoutOn(today.addDays(-1), [['back-squat', 5, 100]]));
  await weighIn('83.3');
  const line = await screen.findByText(/^Today’s weigh-in is [\d.]+ kg above your trend\./);
  expect(line).toHaveTextContent(/above your trend\. Likely causes: carbohydrate yesterday, 340 g against your usual 230 g; a workout yesterday\.$/);
  // The figures one tap down, the arithmetic among them, as the coach's other lines.
  await userEvent.click(screen.getByRole('button', { name: /^Coach: Today’s weigh-in is/ }));
  expect(screen.getByText('Carbohydrate yesterday')).toBeInTheDocument();
  expect(screen.getByText('340 g')).toBeInTheDocument();
  expect(screen.getByText('For this to be fat')).toBeInTheDocument();
  expect(screen.getByText(/^about [\d,]+ kcal over your expenditure yesterday$/)).toBeInTheDocument();
  // MM-418: a line of no listed kind has no switch, so it offers no "Settings for" that would land nowhere.
  expect(screen.queryByRole('button', { name: /^Settings for/ })).not.toBeInTheDocument();
});

it('a reading inside the day-to-day noise gets no explanation', async () => {
  await seed();
  await weighIn('82.2');
  expect(screen.queryByText(/weigh-in is .* your trend/)).not.toBeInTheDocument();
});

it('with nothing in the log it says so and offers a weight event', async () => {
  await seed();
  await weighIn('83.3');
  const line = await screen.findByText(/above your trend\./);
  expect(line).toHaveTextContent('Nothing in your log explains this. Day-to-day changes this size are normal and usually water.');
  expect(line).toHaveTextContent('add it as a weight event in Progress.');
});

it('a reading below the trend the morning after an illness is likely water that will come back', async () => {
  await seed();
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-1), type: 'illness' });
  await weighIn('80.7');
  const line = await screen.findByText(/below your trend\./);
  expect(line).toHaveTextContent('Likely cause: illness you noted yesterday. This is most likely water and will probably come back.');
});

it('says nothing about a reading for a person with an eating-disorder history', async () => {
  await seed({ screening: new ScreeningAnswers({ eatingDisorderHistory: true }), yesterdaysCarbs: 340 });
  await weighIn('83.3');
  expect(screen.queryByText(/your trend\./)).not.toBeInTheDocument();
});
