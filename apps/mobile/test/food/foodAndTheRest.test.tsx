import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { failing } from '../support/failing';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { never } from '../support/never';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/**
 * Where the Food screen meets the rest of the app: the cases of the
 * Dashboard's, the Coach's and the health check's Flutter tests that go
 * through it.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function seed(): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
}

async function logManually(sheet: HTMLElement, name: string, kcal: string): Promise<void> {
  await enterManually(sheet);
  await typeIn(sheet, 'Food name', name);
  await typeIn(sheet, /^Calories/, kcal);
  await press(sheet, 'Log it');
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
}

/** From dashboard_test.dart. */
it('MM-206: logging from the Dashboard ignores the day the Food screen is on', async () => {
  const yesterday = today.addDays(-1);
  await seed();
  await repos.targets.saveTargets(targetsFrom(today.addDays(-30)));
  await repos.food.addFood(foodOn(today, { name: 'Today baseline', meal: 'lunch', kcal: 700, proteinG: 45 }));
  await repos.food.addFood(foodOn(yesterday, { name: 'Yesterday baseline', meal: 'lunch', kcal: 300, proteinG: 20 }));
  renderApp(repos, today);

  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  expect(screen.getByRole('button', { name: 'Yesterday' })).toBeInTheDocument();

  // By the bar at the bottom, not the intake figure, which clears the chosen day.
  await openTab('Dashboard');
  expect(await screen.findByText('kcal left of 2,400')).toBeInTheDocument();
  expect(screen.getByText('1,700')).toBeInTheDocument();

  await logManually(await openAddFood(), 'MM-206 new food', '510');
  const todays = await first(repos.food.watchFood(today));
  expect(todays).toHaveLength(2);
  expect(todays.find((e) => e.name === 'MM-206 new food')?.kcal).toBe(510);
  expect(await first(repos.food.watchFood(yesterday))).toHaveLength(1);
  expect(await screen.findByText('1,190')).toBeInTheDocument();

  // The Food screen is still on the day it was left on, and logs to it.
  await openTab('Food');
  expect(await screen.findByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
  await logManually(await openAddFood(), 'MM-206 historical food', '250');
  const historical = await first(repos.food.watchFood(yesterday));
  expect(historical.map((e) => e.name)).toContain('MM-206 historical food');
  expect(historical).toHaveLength(2);
  expect(await first(repos.food.watchFood(today))).toHaveLength(2);
});

/** From one_calorie_visual_test.dart. */
it('MM-187: the Food screen shows exactly one arc', async () => {
  await seed();
  await repos.targets.saveTargets(targetsFrom(today.addDays(-3), { kcal: 2000 }));
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText(/kcal left of 2,000/);
  expect(document.querySelectorAll('.mm-horizon')).toHaveLength(1);
});

for (const failed of [false, true]) {
  /** From pause_state_display_test.dart. */
  it(`MM-183: the Food screen's targets wait for pauses (${failed ? 'failed' : 'loading'})`, async () => {
    await seed();
    renderApp(repos, today, {
      change: (services) => ({
        ...services,
        pauses: {
          savePause: (pause) => services.pauses.savePause(pause),
          deletePause: (pause) => services.pauses.deletePause(pause),
          watchPauses: () => (failed ? failing() : never()),
        },
      }),
    });
    await openTab('Food');
    expect(
      await screen.findByText(
        failed ? 'Pause history could not be loaded. Reopen the app to retry.' : 'Loading pause history…',
      ),
    ).toBeInTheDocument();
    expect(document.querySelector('.mm-horizon')).toBeNull();
  });
}

it('MM-148: a paused day on the Food screen is a guide, never over', async () => {
  await seed();
  await repos.targets.saveTargets(targetsFrom(today.addDays(-3), { kcal: 2000 }));
  await repos.pauses.savePause(new Pause({ from: today.addDays(-1), to: today.addDays(4), reason: 'travel' }));
  await repos.food.addFood(foodOn(today, { name: 'Wedding dinner', kcal: 3400 }));
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText(/paused, guide/)).toBeInTheDocument();
  expect(screen.queryByText(/kcal over/)).not.toBeInTheDocument();
});

/** MM-114, from under_eating_notice_test.dart. */
async function markComplete(name: string, kcal: number): Promise<HTMLElement> {
  await seed();
  await repos.food.addFood(foodOn(today, { name, meal: 'breakfast', kcal, proteinG: 6, carbsG: 30, fatG: 5 }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Complete' }));
  return screen.findByRole('dialog', { name: 'Is this everything you ate today?' });
}

it('marking a very low day complete asks once', async () => {
  const question = await markComplete('Toast', 200);
  await userEvent.click(within(question).getByRole('button', { name: 'Mark partial' }));
  await expect.poll(() => first(repos.dayMarks.watchCompleteness(today))).toBe('partial');
});

it('a fast is a legitimate yes', async () => {
  const question = await markComplete('Coffee', 20);
  await userEvent.click(within(question).getByRole('button', { name: 'Yes' }));
  await expect.poll(() => first(repos.dayMarks.watchCompleteness(today))).toBe('complete');
});

it('closing the question without an answer marks nothing', async () => {
  await markComplete('Toast', 200);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
  expect(await first(repos.dayMarks.watchCompleteness(today))).toBe('unmarked');
});

/** MM-112, from health_recheck_test.dart; the Progress half of it is with the Progress screen. */
it('bariatric surgery suppresses targets but keeps logging available', async () => {
  await repos.setup.saveSetup(
    typicalSetup({
      screening: new ScreeningAnswers({ bariatricSurgery: true }),
      onboardedOn: today,
      healthCheckConfirmedOn: today,
    }),
  );
  await repos.weights.saveWeight(today, 80);
  renderApp(repos, today);
  const sheet = await openAddFood();
  expect(await first(repos.targets.watchTargetsHistory())).toEqual([]);
  await enterManually(sheet);
  await typeIn(sheet, 'Food name', 'Lunch');
  await typeIn(sheet, 'Protein g', '30');
  await typeIn(sheet, 'Carbs g', '40');
  await typeIn(sheet, 'Fat g', '15');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  expect(await first(repos.targets.watchTargetsHistory())).toEqual([]);
});
