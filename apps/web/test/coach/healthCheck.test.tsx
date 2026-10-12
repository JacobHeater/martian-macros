import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-112: the health check where the Coach screen meets it. Carried over
 * from health_recheck_test.dart; the ones at the opening of the app are in
 * test/app/healthRecheck.test.tsx.
 */
const today = CalendarDate.of(2026, 10, 5);

it('entering a deficit confirms health answers before saving the goal', async () => {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ goalMode: 'maintenance', onboardedOn: today.addDays(-10), healthCheckConfirmedOn: today.addDays(-10) }),
  );
  await repos.weights.saveWeight(today, 80);
  renderApp(repos, today);

  await openTab('Coach');
  await userEvent.click(await screen.findByRole('button', { name: 'Change' }));
  const sheet = await screen.findByRole('dialog', { name: 'Choose a goal' });
  await userEvent.click(within(sheet).getByText('Fat loss'));

  const confirm = await screen.findByRole('button', { name: 'Confirm answers' });
  expect((await repos.setup.loadSetup())?.goalMode).toBe('maintenance');

  await userEvent.click(confirm);
  await expect.poll(async () => (await repos.setup.loadSetup())?.goalMode).toBe('fatLoss');
  expect((await repos.setup.loadSetup())?.healthCheckConfirmedOn).toBe(today);
});

it('Coach shows insulin and weight-affecting medication cautions', async () => {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({
      screening: new ScreeningAnswers({ insulinOrSulfonylurea: true, weightAffectingMedication: true }),
      onboardedOn: today,
      healthCheckConfirmedOn: today,
    }),
  );
  await repos.weights.saveWeight(today, 80);
  renderApp(repos, today);

  await openTab('Coach');
  expect(await screen.findByText(/limits loss to the gentlest pace/)).toBeInTheDocument();
  expect(screen.getByText(/Some medications can change weight or water retention/)).toBeInTheDocument();
});
