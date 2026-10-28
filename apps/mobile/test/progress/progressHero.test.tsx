import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';

/**
 * MM-287: the Progress hero has one figure, the trend weight, with the week's
 * change beneath it in one line; the lifts are rows of their section with
 * the estimate's disclaimer once, each opening the lift's history.
 */
const today = CalendarDate.of(2026, 10, 13);

async function openProgress(): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await new DemoSeed(today).replace(repos);
  renderApp(repos, today);
  await openCoach();
  await screen.findByText(/^Trend weight/);
  return repos;
}

it('the hero has one figure, the trend weight, and the changes as one line beneath it', async () => {
  await openProgress();
  const hero = screen.getByRole('heading', { name: 'Weight trend' }).closest('.mm-surface') as HTMLElement;
  const figures = hero.querySelectorAll('.chart-stat-figure, .food-hero-figure, .app-figure');
  expect(figures).toHaveLength(1);
  expect(figures[0]?.textContent).toMatch(/^Trend weight \d+\.\d lb$/);
  expect(hero.querySelector('.chart-stat-line')?.textContent).toMatch(/^[−+]\d+\.\d lb last 7 days · [−+]\d+\.\d lb since start$/);
});

it('the lifts are rows, four at most, with one disclaimer, and a row opens the lift’s history', async () => {
  await openProgress();
  const section = (await screen.findByRole('heading', { name: 'Strength trends' })).closest('.mm-section') as HTMLElement;
  // Every fold starts closed (MM-676).
  const header = within(section).queryByRole('button', { name: /^Strength trends/ });
  if (header?.getAttribute('aria-expanded') === 'false') await userEvent.click(header);
  const rows = [...section.querySelectorAll('.mm-list-row')].filter((row) => !row.textContent?.startsWith('All lift histories'));
  expect(rows).toHaveLength(4);
  for (const row of rows) expect(row.textContent).toMatch(/Est\. max/);
  expect(section.querySelectorAll('.app-caption')).toHaveLength(1);
  expect(section.querySelector('.app-caption')?.textContent).toMatch(/not a real max/);
  expect(section.querySelector('.mm-surface, .mm-info-card, svg.chart')).toBeNull();
  await userEvent.click(within(section).getByRole('button', { name: /^Back squat/ }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Back squat' })).toBeInTheDocument();
  expect(screen.getByText('Qualifying sessions')).toBeInTheDocument();
});
