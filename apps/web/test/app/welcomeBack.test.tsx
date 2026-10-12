import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';

/** MM-147: coming back after a gap. Carried over from welcome_back_test.dart. */
const today = CalendarDate.of(2026, 10, 5);

async function lastActive(daysAgo: number): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-210) }).copyWith({ healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today.addDays(-daysAgo), 82);
  return repos;
}

const shell = () => screen.findByRole('navigation', { name: 'Destinations' });

it('after three weeks away, one screen asks only for a weigh-in', async () => {
  renderApp(await lastActive(22), today);
  expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(screen.getByText('To pick up, the coach needs one thing: a weigh-in.')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Destinations' })).not.toBeInTheDocument();
});

it('nothing says how long, or that anything ended', async () => {
  renderApp(await lastActive(22), today);
  await screen.findByRole('heading', { name: 'Welcome back' });
  const all = (document.body.textContent ?? '').toLowerCase();
  for (const word of ['21', '22', 'days', 'missed', 'streak', 'lost', 'gap']) {
    expect(all, word).not.toContain(word);
  }
});

it('a weigh-in opens the dashboard', async () => {
  const repos = await lastActive(22);
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await shell()).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
  expect((await first(repos.weights.watchWeights())).some((w) => w.date === today)).toBe(true);
});

it('Later opens the dashboard, and it is not shown again the next day for the same absence', async () => {
  const repos = await lastActive(22);
  const view = renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Later' }));
  expect(await shell()).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();

  view.unmount();
  renderApp(repos, today.addDays(1));
  expect(await shell()).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
});

it('six days away is not a gap', async () => {
  renderApp(await lastActive(7), today);
  expect(await shell()).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
});

it('after a long gap the health check is asked again', async () => {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-300) }).copyWith({ healthCheckConfirmedOn: today.addDays(-125) }),
  );
  await repos.weights.saveWeight(today.addDays(-121), 82);
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Later' }));
  expect(await screen.findByRole('heading', { name: 'Health check' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Destinations' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Later' })).not.toBeInTheDocument();
});
