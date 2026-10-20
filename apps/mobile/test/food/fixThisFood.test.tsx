import { within } from '@testing-library/react';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { InMemoryOnlineFoodSource } from '../../src/foodOnline/InMemoryOnlineFoodSource';
import { openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-153, "Fix this food": a database food is copied into the person's own,
 * corrected, and that copy is what its barcode finds from then on; nothing
 * leaves the phone and the database is not changed.
 */
const today = CalendarDate.of(2026, 10, 20);
const bar = FixturePack.entries.find((e) => e.food.name === 'Protein bar, chocolate');
const gtin14 = bar?.barcodes?.[0] ?? '';
let repos: InMemoryRepositories;
let catalog: FoodCatalog;
let online: InMemoryOnlineFoodSource;

beforeAll(async () => {
  catalog = await fixtureCatalog();
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  // A source that would answer, so a request would show: none may be made.
  online = new InMemoryOnlineFoodSource('off', bar === undefined ? [] : [bar]);
  await repos.preferences.saveOnlineLookup('always');
});

async function scanTheBar(sheet: HTMLElement) {
  await press(sheet, 'Scan');
  await typeIn(sheet, 'Or type the digits', gtin14.substring(1));
  await press(sheet, 'Look up');
}

it('the corrected copy is saved on the phone with the barcode, and is what that barcode finds from then on', async () => {
  expect(gtin14).not.toBe('');
  renderApp(repos, today, { change: (services) => ({ ...withCatalog(catalog)(services), onlineSources: [online] }) });
  await openTab('Food');
  const sheet = await openAddFood();
  await scanTheBar(sheet);
  await within(sheet).findByRole('heading', { name: 'Protein bar, chocolate' });
  await press(sheet, 'Fix this food');

  await within(sheet).findByRole('heading', { name: 'Fix this food' });
  expect(within(sheet).getByText(/Your copy is what you find from now on/)).toHaveTextContent('Nothing is uploaded.');
  // Prefilled from the pack at its first serving: one bar of 60 g, 380 kcal per 100 g.
  expect(within(sheet).getByRole('textbox', { name: /^Calories/ })).toHaveValue('228');
  await typeIn(sheet, /^Protein/, '22');
  await press(sheet, /^Save/);

  const saved = await first(repos.customFoods.watchCustomFoods());
  expect(saved).toHaveLength(1);
  expect(saved[0]?.barcode).toBe(gtin14);
  expect(saved[0]?.perServing.proteinG).toBe(22);
  expect(saved[0]?.servingGrams).toBe(60);

  // The same barcode now opens the person's own food, not the pack's.
  await press(sheet, /^Back/);
  await scanTheBar(sheet);
  await within(sheet).findByRole('heading', { name: /^Protein bar, chocolate, Test Brand/ });
  // One's own food has nothing to fix: it is edited under Saved.
  expect(within(sheet).queryByRole('button', { name: 'Fix this food' })).toBeNull();
  expect(online.asked, 'nothing was asked online').toEqual([]);
});

