import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { BiologicalSex } from '../../src/domain/BiologicalSex';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { renderApp } from '../support/renderApp';

/**
 * MM-112: the repeat health check when the app is opened. The Flutter
 * tests of it that go through Settings and Coach come over with those
 * screens (health_recheck_test.dart).
 */
const today = CalendarDate.of(2026, 10, 10);

async function due(sex: BiologicalSex = 'female', skips = 0): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ sex, onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-91) }).copyWith({
      healthCheckSkipCount: skips,
    }),
  );
  await repos.weights.saveWeight(today, 70);
  return repos;
}

const shell = () => screen.findByRole('button', { name: 'Menu' });

it('is asked ninety days after the last, before anything else', async () => {
  renderApp(await due(), today);
  expect(await screen.findByRole('heading', { name: 'Health check' })).toBeInTheDocument();
  expect(screen.getByText(/Has anything changed since your last health check\?/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
});

it('confirming records the day, and the shell opens', async () => {
  const repos = await due();
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Confirm answers' }));
  expect(await shell()).toBeInTheDocument();
  const setup = await repos.setup.loadSetup();
  expect(setup?.healthCheckConfirmedOn).toBe(today);
  expect(setup?.profileRevision).toBe(0);
});

it('reporting pregnancy immediately moves the goal to maintenance', async () => {
  const repos = await due();
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('checkbox', { name: 'Pregnant' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm answers' }));
  await shell();
  const setup = await repos.setup.loadSetup();
  expect(setup?.screening.pregnant).toBe(true);
  expect(setup?.goalMode).toBe('maintenance');
  expect(setup?.profileRevision, 'the answers changed').toBe(1);
});

it('male profiles do not see pregnancy or breastfeeding questions', async () => {
  renderApp(await due('male'), today);
  await screen.findByRole('heading', { name: 'Health check' });
  expect(screen.queryByRole('checkbox', { name: 'Pregnant' })).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox', { name: 'Breastfeeding' })).not.toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'Thyroid condition' })).toBeInTheDocument();
});

it('two skips defer to the next launch then pause deficits', async () => {
  const repos = await due();
  const view = renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
  expect(await shell()).toBeInTheDocument();
  expect((await repos.setup.loadSetup())?.healthCheckSkipCount).toBe(1);
  expect((await repos.setup.loadSetup())?.goalMode).toBe('fatLoss');

  // Put off for this launch only: the next opening asks again, more firmly.
  view.unmount();
  const again = renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Skip again and pause deficit coaching' }));
  await shell();
  const setup = await repos.setup.loadSetup();
  expect(setup?.healthCheckSkipCount).toBe(2);
  expect(setup?.goalMode).toBe('maintenance');

  // After two skips there is no third.
  again.unmount();
  renderApp(repos, today);
  await screen.findByRole('heading', { name: 'Health check' });
  expect(screen.queryByRole('button', { name: /Not now|Skip again/ })).not.toBeInTheDocument();
});
