import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-111 through the app. Carried over from underweight_flows_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

it('a 170 cm woman at 50 kg is offered maintenance and lean gain only, and told why', async () => {
  renderApp(repos, today);
  const press = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }));
  const type = (label: string, text: string) => userEvent.type(screen.getByRole('textbox', { name: label }), text);
  await userEvent.click(await screen.findByRole('button', { name: 'Begin' }));
  await press('Female');
  await press('Next');
  await press(/Choose a date/);
  await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'OK' }));
  await press('Next');
  await type('Feet', '5');
  await type('Inches', '7');
  await type('lb', '110');
  // Measurements, activity, training, health.
  for (let i = 0; i < 4; i++) await press('Next');

  expect(await screen.findByRole('heading', { name: 'Your plan' })).toBeInTheDocument();
  const offered = (goal: string) => screen.queryByRole('button', { name: new RegExp(`^${goal}`) });
  expect(offered('Maintenance')).toBeInTheDocument();
  expect(offered('Lean gain')).toBeInTheDocument();
  expect(offered('Fat loss')).not.toBeInTheDocument();
  expect(offered('Recomp')).not.toBeInTheDocument();
  expect(screen.getByText(/below the range where the app will plan a calorie/)).toBeInTheDocument();
});

it('in the caution zone the Coach screen carries a caution', async () => {
  // 180 cm and 63 kg is BMI 19.4.
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 63);
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText(/close to the low end of the healthy range/)).toBeInTheDocument();
});

it('a deficit ends at the check-in when weight stays under BMI 18.5, and the goal becomes maintenance', async () => {
  await repos.setup.saveSetup(
    typicalSetup({ sex: 'female', onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }),
  );
  // typicalSetup is 180 cm; BMI 18.3 at 180 cm is 59.3 kg.
  for (let d = 20; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 59.3);
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-30), {
      kcal: 1500,
      proteinG: 110,
      fatG: 50,
      carbsG: 190,
      tdeeKcal: 2000,
      tdeeSigmaKcal: 250,
      tdeeStatus: 'updated',
    }),
  );
  renderApp(repos, today);
  await expect.poll(async () => (await first(repos.targets.watchTargetsHistory())).length, { timeout: 5000 }).toBe(2);
  const history = await first(repos.targets.watchTargetsHistory());
  expect(history[1]?.mode).toBe('maintenance');
  expect(history[1]?.targets.flags.has('underweightMaintenance')).toBe(true);
  expect((history[1]?.targets.kcal ?? 0) - (history[0]?.targets.kcal ?? 0)).toBeGreaterThan(100);
  await expect.poll(async () => (await repos.setup.loadSetup())?.goalMode, { timeout: 5000 }).toBe('maintenance');
});
