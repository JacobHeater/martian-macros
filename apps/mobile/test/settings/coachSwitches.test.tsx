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
