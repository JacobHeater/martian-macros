import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { InMemoryHealthRationale } from '../../src/fixtures/InMemoryHealthRationale';
import { renderApp } from '../support/renderApp';

/**
 * MM-731: Health Connect's permission sheet links to why the app asks. Sent
 * here by it, the app opens on its privacy policy; otherwise it opens as
 * it always does.
 */
it('sent here by Health Connect to read why the app asks, the app opens on its privacy policy', async () => {
  renderApp(undefined, undefined, {
    change: (services) => ({ ...services, healthRationale: new InMemoryHealthRationale(true) }),
  });
  expect(await screen.findByRole('heading', { name: 'Privacy policy' })).toBeInTheDocument();
});

it('not sent here, the app opens as it always does', async () => {
  renderApp(undefined, undefined, {
    change: (services) => ({ ...services, healthRationale: new InMemoryHealthRationale(false) }),
  });
  await screen.findByRole('button', { name: 'Menu' });
  expect(screen.queryByRole('heading', { name: 'Privacy policy' })).toBeNull();
});
