import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-123, MM-130: Settings > Coach holds the exact-targets and ease-into-maintenance switches, both off by default. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function openCoach() {
  renderApp(repos, today);
  const settings = await openSettings();
  // The section's header: the button inside the heading named Coach, not the Coach tab. Opened if it is folded.
  const heading = within(topLayer()).getByRole('heading', { level: 2, name: 'Coach' });
  const header = within(heading).getByRole('button');
  if (header.getAttribute('aria-expanded') === 'false') await userEvent.click(header);
  return settings;
}

it('exact targets is off until switched on', async () => {
  await openCoach();
  const exact = await screen.findByRole('switch', { name: /^Exact targets/ });
  expect(exact).not.toBeChecked();
  expect(await first(repos.preferences.watchExactTargets())).toBe(false);
  await userEvent.click(exact);
  await expect.poll(async () => first(repos.preferences.watchExactTargets())).toBe(true);
});

it('ease into maintenance is off until switched on, and claims nothing about metabolism', async () => {
  await openCoach();
  const ease = await screen.findByRole('switch', { name: /^Ease into maintenance/ });
  expect(ease).not.toBeChecked();
  expect(screen.getByText(/changes nothing about your metabolism/)).toBeInTheDocument();
  await userEvent.click(ease);
  await expect.poll(async () => first(repos.preferences.watchEaseIntoMaintenance())).toBe(true);
});

// MM-678: the floors the coach holds cardio to, the coach's defaults until typed, each saved on its own.
it('the cardio floors show the defaults until set, and a typed floor is kept', async () => {
  await openCoach();
  const steps = await screen.findByRole('textbox', { name: 'Steps a day floor' });
  expect(steps).toHaveValue('8000');
  expect(screen.getByText(/The coach's default is 8,000 a day/)).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Cardio minutes a week floor' })).toHaveValue('150');
  await userEvent.clear(steps);
  await userEvent.type(steps, '10000');
  await userEvent.click(screen.getByRole('button', { name: 'Save steps floor' }));
  await expect.poll(async () => (await first(repos.preferences.watchCardioFloors())).stepsPerDay).toBe(10000);
  expect((await first(repos.preferences.watchCardioFloors())).minutesPerWeek).toBeUndefined();
  expect(await screen.findByText(/Yours\. The coach holds you to it/)).toBeInTheDocument();
});

it('a floor out of range is refused and nothing is saved', async () => {
  await openCoach();
  const minutes = await screen.findByRole('textbox', { name: 'Cardio minutes a week floor' });
  await userEvent.clear(minutes);
  await userEvent.type(minutes, '5000');
  await userEvent.click(screen.getByRole('button', { name: 'Save cardio floor' }));
  expect(await screen.findByText('That floor is out of range.')).toBeInTheDocument();
  expect((await first(repos.preferences.watchCardioFloors())).minutesPerWeek).toBeUndefined();
});
