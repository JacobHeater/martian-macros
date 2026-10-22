import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { onlineSource } from '../support/onlineFixtures';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/**
 * MM-57, MM-58: Settings names each food data source with its licence and
 * address, and holds the online lookup choice.
 */
const today = CalendarDate.of(2026, 10, 20);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
});

it('the sources screen names each source, its licence and its address, and what goes online', async () => {
  renderApp(repos, today, { change: (services) => ({ ...services, onlineSources: [onlineSource()] }) });
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Food data sources/ }));
  const sources = within(topLayer());
  await sources.findByRole('heading', { name: 'Food data sources' });
  expect(sources.getAllByText(/USDA FoodData Central/).length).toBeGreaterThan(0);
  expect(sources.getByText(/Public domain/)).toBeInTheDocument();
  expect(sources.getAllByText(/fdc\.nal\.usda\.gov/).length).toBeGreaterThan(0);
  expect(sources.getByText(/Open Database License 1\.0/)).toBeInTheDocument();
  expect(sources.getAllByText(/openfoodfacts\.org/).length).toBeGreaterThan(0);
  expect(sources.getAllByText(/martian-macros-food-data/).length).toBeGreaterThan(0);
  expect(sources.getByText(/Those services see your IP address/)).toBeInTheDocument();
  expect(sources.getByText(/not been reviewed by a lawyer/)).toBeInTheDocument();
  // Each source's terms on its own row: USDA public domain with its requested citation, Open Food Facts ODbL for the
  // database and DbCL for its contents; and USDA's citation in the attribution, in its own words.
  expect(sources.getByText(/Public domain, with a citation requested/)).toBeInTheDocument();
  expect(sources.getByText(/Database: Open Database License 1\.0 · contents: Database Contents License 1\.0/)).toBeInTheDocument();
  expect(
    sources.getByText(/U\.S\. Department of Agriculture, Agricultural Research Service\. FoodData Central, 2019\. fdc\.nal\.usda\.gov\./),
  ).toBeInTheDocument();
  // Addresses are text: nothing on the screen opens a browser (MM-57's decision).
  expect(topLayer().querySelector('a[href]')).toBeNull();
  // The licences are never called verified, and the records never promised right.
  expect(topLayer().textContent).not.toMatch(/verified/i);
});

it('the online lookup choice is changed from Settings, and the words say what is sent', async () => {
  renderApp(repos, today, { change: (services) => ({ ...services, onlineSources: [onlineSource()] }) });
  const settings = await openSettings();
  const row = settings.getByText(/^Ask each time\. When a food is not on this phone/);
  expect(row).toHaveTextContent('only the barcode or your search words go to Open Food Facts');
  await userEvent.click(settings.getByRole('button', { name: 'Change online lookup' }));
  await userEvent.click(await screen.findByRole('option', { name: 'Never' }));
  await expect.poll(async () => first(repos.preferences.watchOnlineLookup())).toBe('never');
  expect(await settings.findByText(/^Never\. When a food is not on this phone/)).toBeInTheDocument();
});

it('a build with no online source has no such row, and says nothing is ever sent', async () => {
  renderApp(repos, today);
  const settings = await openSettings();
  expect(settings.queryByRole('button', { name: 'Change online lookup' })).toBeNull();
  await userEvent.click(settings.getByRole('button', { name: /^Food data sources/ }));
  const sources = within(topLayer());
  await sources.findByRole('heading', { name: 'Food data sources' });
  expect(sources.getByText(/no online source, so nothing is ever sent/)).toBeInTheDocument();
});
