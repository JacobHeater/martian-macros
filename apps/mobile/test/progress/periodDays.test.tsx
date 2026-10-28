import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Profile } from '../../src/domain/Profile';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';

/** MM-20: period days marked on Progress, so the trend expects the water; never offered to a male profile. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function seed({ sex, menopause = false }: { sex: 'male' | 'female'; menopause?: boolean }): Promise<void> {
  await repos.setup.saveSetup(
    typicalSetup({ sex, onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today, screening: new ScreeningAnswers({ menopause }) }),
  );
  for (let i = 0; i <= 30; i++) await repos.weights.saveWeight(today.addDays(-i), 65 + (i % 3) * 0.1);
}

it('a female profile marks and unmarks the last two weeks, and the marks are stored', async () => {
  await seed({ sex: 'female' });
  renderApp(repos, today);
  await openCoach();
  const card = (await screen.findByRole('heading', { name: 'Period days' })).closest('.mm-section') as HTMLElement;
  const group = within(card).getByRole('group', { name: 'Period days, the last two weeks' });
  expect(within(group).getAllByRole('button')).toHaveLength(14);
  await userEvent.click(within(group).getByRole('button', { name: 'Today' }));
  await userEvent.click(within(group).getByRole('button', { name: 'Yesterday' }));
  await expect.poll(async () => (await first(repos.flowDays.watchFlowDays())).map((d) => d.date)).toEqual([today.addDays(-1), today]);
  expect(within(group).getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(within(group).getByRole('button', { name: 'Today' }));
  await expect.poll(async () => (await first(repos.flowDays.watchFlowDays())).length).toBe(1);
});

it('the chart shades the days around a start, from five days before through two after', async () => {
  await seed({ sex: 'female' });
  for (let i = 10; i >= 6; i--) await repos.flowDays.markFlowDay(today.addDays(-i));
  renderApp(repos, today);
  await openCoach();
  await screen.findByRole('heading', { name: 'Period days' });
  await screen.findByText('Weight trend');
  await expect.poll(() => document.querySelector('.chart-cycle')).not.toBeNull();
  const rect = document.querySelector('.chart-cycle');
  expect(rect).not.toBeNull();
  // The start was 10 days ago: the window runs from 15 days ago to 8 days ago, on a 30-day axis.
  expect(rect?.getAttribute('data-from')).toBe(`${30 - 1 - 15}`);
});

it('a male profile never sees it', async () => {
  await seed({ sex: 'male' });
  renderApp(repos, today);
  await openCoach();
  await screen.findByText('Weight trend');
  expect(screen.queryByRole('heading', { name: 'Period days' })).not.toBeInTheDocument();
});

it('after menopause it is not offered either', async () => {
  await seed({ sex: 'female', menopause: true });
  renderApp(repos, today);
  await openCoach();
  await screen.findByText('Weight trend');
  expect(screen.queryByRole('heading', { name: 'Period days' })).not.toBeInTheDocument();
  expect(new Profile({ sex: 'female', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 165 }).sex).toBe('female');
});
