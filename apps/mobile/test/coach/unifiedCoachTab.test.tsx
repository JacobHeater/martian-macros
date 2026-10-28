import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-667: Progress and Coach are consolidated into the unified Coach tab:
 * four destinations in the bottom bar, the Executive summary card at the top,
 * the Weight trend chart and body measurements in the same scroll, collapsible
 * telemetry sections at the bottom, and no 14-day Recent insights feed.
 */
const today = CalendarDate.of(2026, 10, 13);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await new DemoSeed(today).replace(repos);
});

it('shows four destinations in the bottom bar and unifies Executive summary, Weight trend, Measurements, and collapsible telemetry on Coach', async () => {
  renderApp(repos, today);
  const bar = await screen.findByRole('navigation', { name: 'Destinations' });
  expect(within(bar).getAllByRole('button').map((b) => b.textContent?.trim())).toEqual([
    'Dashboard',
    'Food',
    'Train',
    'Coach',
  ]);

  await openTab('Coach');
  const summaryHeading = await screen.findByRole('heading', { name: 'Executive summary' });
  const summarySection = summaryHeading.closest('.mm-section') as HTMLElement;
  expect(within(summarySection).getByText('7-day calorie adherence')).toBeInTheDocument();
  expect(within(summarySection).getByText('7-day protein floor')).toBeInTheDocument();
  expect(within(summarySection).getByText('Today’s runway')).toBeInTheDocument();

  // Weight trend chart and measurement sections from Progress sit on the same unified Coach tab.
  expect(await screen.findByRole('heading', { name: 'Weight trend' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Waist' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Strength trends' })).toBeInTheDocument();

  // The retired 14-day Recent insights feed is gone.
  expect(screen.queryByRole('heading', { name: 'Recent insights' })).toBeNull();

  // Telemetry sections at the bottom are collapsible.
  const metabolism = screen.getByRole('heading', { name: 'Your metabolism' }).closest('.mm-section') as HTMLElement;
  const metabolismButton = within(metabolism).getByRole('button', { name: /^Your metabolism/ });
  expect(metabolismButton).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(metabolismButton);
  expect(metabolismButton).toHaveAttribute('aria-expanded', 'false');
});
