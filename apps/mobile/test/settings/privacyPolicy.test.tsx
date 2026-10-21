import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { privacyPolicy } from '../../src/terms/privacyPolicy';
import type { AppServices } from '../../src/state/AppServices';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-95: the privacy policy is read from Settings, About, beside the terms of use, for the phone the app is on. */
const today = CalendarDate.of(2026, 10, 21);

async function openPolicy(change?: (services: AppServices) => AppServices) {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  renderApp(repos, today, change === undefined ? {} : { change });
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Privacy policy/ }));
  const policy = within(topLayer());
  expect(await policy.findByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument();
  return policy;
}

it('About has the privacy policy beside the terms of use, with its version', async () => {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  renderApp(repos, today);
  const settings = await openSettings();
  const terms = settings.getByRole('button', { name: /^Terms of use/ });
  const policy = settings.getByRole('button', { name: /^Privacy policy/ });
  expect(terms.compareDocumentPosition(policy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(settings.getByText(new RegExp(`^Version ${privacyPolicy.version}: what the app keeps`))).toBeInTheDocument();
});

it('shows the version, the short account and every section in full, with nothing to agree to', async () => {
  const policy = await openPolicy();
  expect(policy.getByText(/^Version 1, in effect from October 21, 2026\.$/)).toBeInTheDocument();
  expect(policy.getByRole('heading', { name: 'In short' })).toBeInTheDocument();
  for (const section of privacyPolicy.sectionsOn('android')) {
    expect(policy.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
    for (const paragraph of section.paragraphs) expect(policy.getByText(paragraph)).toBeVisible();
  }
  expect(policy.queryByRole('button', { name: 'I agree' })).not.toBeInTheDocument();
});

it('on an iPhone, names Apple Health and Apple’s reader, and no Google component', async () => {
  const policy = await openPolicy((services) => ({ ...services, platform: 'ios' }));
  expect(policy.getByRole('heading', { level: 2, name: '3. Apple Health' })).toBeInTheDocument();
  expect(policy.queryByText(/ML Kit/)).not.toBeInTheDocument();
});
