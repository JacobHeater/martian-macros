import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryHealthRationale } from '../../src/fixtures/InMemoryHealthRationale';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { renderApp } from '../support/renderApp';

/**
 * MM-731: Health Connect's permission sheet links to why the app asks. Sent
 * here by it, the app opens on its privacy policy; otherwise it opens as
 * it always does.
 */
const today = CalendarDate.of(2026, 10, 5);

const onboarded = async (): Promise<InMemoryRepositories> => {
  const repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  return repos;
};

it('sent here by Health Connect to read why the app asks, the app opens on its privacy policy', async () => {
  renderApp(await onboarded(), today, {
    change: (services) => ({ ...services, healthRationale: new InMemoryHealthRationale(true) }),
  });
  expect(await screen.findByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument();
});

it('not sent here, the app opens as it always does', async () => {
  renderApp(await onboarded(), today, {
    change: (services) => ({ ...services, healthRationale: new InMemoryHealthRationale(false) }),
  });
  await screen.findByRole('button', { name: 'Menu' });
  expect(screen.queryByRole('heading', { name: 'Privacy policy' })).toBeNull();
});
