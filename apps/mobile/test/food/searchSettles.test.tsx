import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { SearchHit } from '../../src/foodCatalog/SearchHit';
import { openAddFood } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-408: the search results never empty between a keystroke and the next
 * answer, and the packs are asked once the typing pauses, not on every
 * keystroke.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let searched: string[];
/** When set, every search's answer waits on it, as a slow pack read would. */
let held: Promise<void> | undefined;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  searched = [];
  held = undefined;
});

/** The fixture catalog, with its searches counted and held back on demand. */
async function watchedCatalog(): Promise<FoodCatalog> {
  const real = await fixtureCatalog();
  const watched = Object.create(real) as FoodCatalog;
  Object.defineProperty(watched, 'search', {
    value: async (query: string, options?: { limit?: number; offset?: number }): Promise<SearchHit[]> => {
      searched.push(query);
      const hits = await real.search(query, options);
      if (held !== undefined) await held;
      return hits;
    },
  });
  return watched;
}

it('the results stay on screen while the next search is answered, and the packs are asked once the typing pauses', async () => {
  renderApp(repos, today, { change: withCatalog(await watchedCatalog()) });
  await openTab('Food');
  const sheet = await openAddFood();
  const field = sheet.querySelector('input') as HTMLInputElement;
  await userEvent.type(field, 'chicken');
  expect(await screen.findByText('Chicken breast, cooked')).toBeInTheDocument();
  expect(searched.length).toBeLessThan('chicken'.length);

  let release = () => undefined as void;
  held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await userEvent.type(field, ' b');
  // The pause has passed and the new search is pending; the old answer is still there.
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(screen.getByText('Chicken breast, cooked')).toBeInTheDocument();
  expect(searched.at(-1)).toBe('chicken b');

  release();
  expect(await screen.findByText('Chicken breast, cooked')).toBeInTheDocument();
  expect(screen.queryByText('Banana')).not.toBeInTheDocument();
});
