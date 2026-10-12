import { within } from '@testing-library/react';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { AppServices } from '../../src/state/AppServices';
import { openAddFood, press, typeIn } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { scannerReading } from '../support/scannerReading';

/**
 * MM-43: scan a barcode, or type it, and log the product found. The camera
 * is a fake; the real plugin needs a device. Carried over from
 * barcode_scan_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let catalog: FoodCatalog;

const known = FixturePack.entries.find((e) => (e.barcodes ?? []).length > 0);
const gtin14 = known?.barcodes?.[0] ?? '';
const ean13 = gtin14.substring(1);
const knownName = known?.food.name ?? '';

beforeAll(async () => {
  catalog = await fixtureCatalog();
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** The scan step, with a camera that reads `digits`, or with none. */
async function openScan(digits?: string): Promise<HTMLElement> {
  const packs = withCatalog(catalog);
  const camera = digits === undefined ? (services: AppServices) => services : scannerReading(digits);
  renderApp(repos, today, { change: (services) => camera(packs(services)) });
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Scan');
  return sheet;
}

it('a scanned product opens its amount step', async () => {
  expect(ean13).not.toBe('');
  const sheet = await openScan(ean13);
  await press(sheet, 'Scan with the camera');
  expect(await within(sheet).findByRole('heading', { name: knownName })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Log it' })).toBeInTheDocument();
});

it('an unknown barcode offers manual entry', async () => {
  const sheet = await openScan('4006381333931');
  await press(sheet, 'Scan with the camera');
  expect(await within(sheet).findByText(/not in the food database/)).toBeInTheDocument();
  await press(sheet, 'Enter manually');
  expect(within(sheet).getByRole('textbox', { name: /^Calories/ })).toBeInTheDocument();
});

it('with the camera denied, typing the digits still works', async () => {
  const sheet = await openScan();
  await press(sheet, 'Scan with the camera');
  expect(await within(sheet).findByText(/camera is not available/)).toBeInTheDocument();
  await typeIn(sheet, 'Or type the digits', ean13);
  await press(sheet, 'Look up');
  expect(await within(sheet).findByRole('heading', { name: knownName })).toBeInTheDocument();
});

it('digits that are not a barcode are said so', async () => {
  const sheet = await openScan();
  await typeIn(sheet, 'Or type the digits', '123');
  await press(sheet, 'Look up');
  expect(await within(sheet).findByText(/not a valid barcode/)).toBeInTheDocument();
});
