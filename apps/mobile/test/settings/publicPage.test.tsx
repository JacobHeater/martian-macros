import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryExternalLinks } from '../../src/fixtures/InMemoryExternalLinks';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { publicPageAddress } from '../../src/terms/publicPageAddress';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/** MM-454: Settings, About opens the public page of the terms and the policy in the phone's browser. */
const today = CalendarDate.of(2026, 10, 21);

async function openAbout(links: InMemoryExternalLinks) {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  renderApp(repos, today, { change: (services) => ({ ...services, externalLinks: links }) });
  return openSettings();
}

it('the address is the one both store listings carry', () => {
  expect(publicPageAddress).toBe('https://jacobheater.github.io/martian-macros/');
});

it('sits under the privacy policy, shows the address and says it opens in the browser', async () => {
  const settings = await openAbout(new InMemoryExternalLinks());
  const policy = settings.getByRole('button', { name: /^Privacy policy/ });
  const web = settings.getByRole('button', { name: /^On the web/ });
  expect(policy.compareDocumentPosition(web) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(settings.getByText('Opens jacobheater.github.io/martian-macros in your browser')).toBeInTheDocument();
});

it('pressed, hands the address to the phone’s browser, and the app opens no screen of its own', async () => {
  const links = new InMemoryExternalLinks();
  const settings = await openAbout(links);
  await userEvent.click(settings.getByRole('button', { name: /^On the web/ }));
  expect(links.opened).toEqual([publicPageAddress]);
  expect(settings.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
});

it('a phone with no browser says so, with the address to type', async () => {
  const links = new InMemoryExternalLinks();
  links.noBrowser = true;
  const settings = await openAbout(links);
  await userEvent.click(settings.getByRole('button', { name: /^On the web/ }));
  expect(
    await screen.findByText('The browser could not be opened. The page is at jacobheater.github.io/martian-macros.'),
  ).toBeInTheDocument();
  expect(links.opened).toEqual([]);
});
