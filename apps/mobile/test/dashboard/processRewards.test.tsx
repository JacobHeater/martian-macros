import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { renderApp } from '../support/renderApp';
import { dashboardLoaded } from '../support/dashboardLoaded';

/** MM-92: reward the work, never the deficit. Carried over from process_rewards_test.dart. */
const today = CalendarDate.of(2026, 10, 14);
let repos: InMemoryRepositories;

async function seed({ eatingDisorderHistory = false }: { eatingDisorderHistory?: boolean } = {}): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({
      onboardedOn: today.addDays(-60),
      screening: new ScreeningAnswers({ eatingDisorderHistory }),
      healthCheckConfirmedOn: today.addDays(-30),
    }),
  );
  await repos.weights.saveWeight(today, 82);
}

async function logWholeDay(daysAgo: number, kcal = 2100): Promise<void> {
  const date = today.addDays(-daysAgo);
  await repos.food.addFood(foodOn(date, { kcal }));
  await repos.dayMarks.setCompleteness(date, 'complete');
}

async function card(): Promise<string> {
  renderApp(repos, today);
  const title = await screen.findByText('Your logging');
  return title.closest('.mm-list-row')?.textContent ?? '';
}

it('a run of whole days is acknowledged quietly', async () => {
  await seed();
  for (let d = 1; d <= 6; d++) await logWholeDay(d);
  const text = await card();
  expect(text).toContain('6 whole days logged in a row.');
  expect(text).not.toContain('forgiven');
});

it('one missed day does not reset it, and says so', async () => {
  await seed();
  for (const d of [1, 2, 3, 4, 5, 6, 8]) await logWholeDay(d);
  const text = await card();
  expect(text).toContain('7 whole days logged in a row.');
  expect(text).toContain('A missed day is forgiven, once a week.');
});

it('two days at 1,700 and 2,800 kcal earn the same', async () => {
  await seed();
  await logWholeDay(1, 1700);
  await logWholeDay(2, 2800);
  await logWholeDay(3);
  expect(await card()).toContain('3 whole days logged in a row.');
});

it('the lower days of a shaped week, eaten a little under plan and not marked, keep the run going (MM-124)', async () => {
  await seed();
  // Monday, Wednesday and Friday 30% higher on 2,000 kcal: 2,400 on those, 1,700 planned on the rest, eaten at 1,550.
  const week = new WeekShape({ higherDays: [1, 3, 5], raise: 0.3 });
  await repos.targetShapes.saveTargetShape(new TargetShape({ since: today.addDays(-60), week }));
  for (let d = 1; d <= 14; d++) {
    const date = today.addDays(-d);
    await repos.food.addFood(foodOn(date, { kcal: week.higherDays.has(date.weekday) ? 2400 : 1550 }));
  }
  const text = await card();
  expect(text).toContain('14 whole days logged in a row.');
  expect(text).not.toContain('forgiven');
});

it('a short run says nothing at all', async () => {
  await seed();
  await logWholeDay(1);
  await logWholeDay(2);
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.queryByText('Your logging')).not.toBeInTheDocument();
});

it('it never mentions weight, deficit or eating less', async () => {
  await seed();
  for (let d = 1; d <= 10; d++) await logWholeDay(d, 1500);
  const all = (await card()).toLowerCase();
  for (const word of [
    'lowest',
    'deficit',
    'under target',
    'under your target',
    'lost',
    'weight',
    'record',
    'best',
    'streak of low',
    'calories',
    'kcal',
  ]) {
    expect(all, word).not.toContain(word);
  }
});

it('with an eating-disorder history nothing refers to weight', async () => {
  await seed({ eatingDisorderHistory: true });
  for (let d = 1; d <= 5; d++) await logWholeDay(d);
  const text = await card();
  expect(text).toContain('5 whole days logged in a row.');
  expect(text.toLowerCase()).not.toContain('weight');
  expect(text.toLowerCase()).not.toContain('lost');
});

it('a pause does not break it', async () => {
  await seed();
  await repos.pauses.savePause(new Pause({ from: today.addDays(-9), to: today.addDays(-3), reason: 'travel' }));
  for (const d of [1, 2, 10, 11, 12]) await logWholeDay(d);
  expect(await card()).toContain('5 whole days logged in a row.');
});
