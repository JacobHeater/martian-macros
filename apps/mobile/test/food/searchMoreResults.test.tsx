import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { openAddFood } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-410: a search lists its first twenty results and offers "More results"
 * while there are more; pressing it lengthens the list by twenty, the first
 * new row takes focus and a status says how many joined, and the offer goes
 * once every match is listed. Exactly a page never offers more, and a new
 * query starts over at one page.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

/** `count` yogurts beside the fixture's one. */
const yogurts = (count: number): PackEntry[] => Array.from({ length: count }, (_, at) => ({
  food: new CatalogFood({
    id: 2000 + at,
    packId: FixturePack.packId,
    name: `Yogurt, flavor ${String(at + 1).padStart(2, '0')}`,
    kcal: 80,
    proteinG: 4,
    carbsG: 12,
    fatG: 2,
    preparation: 'unspecified',
    source: 'fixture',
    sourceId: `test-${2000 + at}`,
    tier: 'reference',
    tierReason: 'Invented for this test.',
  }),
}));

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** The rows of foods named yogurt: the fixture's Greek yogurt and the twenty-six added. */
const yogurtRows = () => screen.queryAllByRole('button', { name: /^(Yogurt, flavor|Greek yogurt)/ });

/** The sheet searched for `text` over the fixture pack and `extra` more foods. */
const searched = async (text: string, extra: PackEntry[] = []) => {
  renderApp(repos, today, { change: withCatalog(await fixtureCatalog(FixturePack.header, [...FixturePack.entries, ...extra])) });
  await openTab('Food');
  const sheet = await openAddFood();
  const field = sheet.querySelector('input') as HTMLInputElement;
  await userEvent.type(field, text);
  return field;
};

it('twenty results and "More results", then every match, the first new row focused and announced, and no more offer', async () => {
  // Twenty-six yogurts beside the fixture's one: twenty-seven matches, two pages.
  await searched('yogurt', yogurts(26));
  const more = await screen.findByRole('button', { name: 'More results' });
  expect(yogurtRows()).toHaveLength(20);
  expect(screen.queryByText(/more results,|more results\./)).not.toBeInTheDocument();

  await userEvent.click(more);
  await waitFor(() => expect(yogurtRows()).toHaveLength(27));
  expect(screen.queryByRole('button', { name: 'More results' })).not.toBeInTheDocument();
  expect(screen.getByText('7 more results, every match listed.')).toHaveAttribute('role', 'status');
  expect(document.activeElement).toBe(yogurtRows()[20]);
});

it('exactly a page of matches never offers more', async () => {
  // Nineteen beside the fixture's one: twenty matches, one page.
  await searched('yogurt', yogurts(19));
  await waitFor(() => expect(yogurtRows()).toHaveLength(20));
  expect(screen.queryByRole('button', { name: 'More results' })).not.toBeInTheDocument();
});

it('a new query starts over at one page, with the offer back', async () => {
  const field = await searched('yogurt', yogurts(26));
  await userEvent.click(await screen.findByRole('button', { name: 'More results' }));
  await waitFor(() => expect(yogurtRows()).toHaveLength(27));
  await userEvent.type(field, '{backspace}{backspace}');
  expect(field.value).toBe('yogu');
  await waitFor(() => expect(yogurtRows()).toHaveLength(20), { timeout: 3000 });
  expect(await screen.findByRole('button', { name: 'More results' })).toBeInTheDocument();
});

it('a search with a page or less never offers more', async () => {
  renderApp(repos, today, { change: withCatalog(await fixtureCatalog()) });
  await openTab('Food');
  const sheet = await openAddFood();
  await userEvent.type(sheet.querySelector('input') as HTMLInputElement, 'chicken');
  expect(await screen.findByText('Chicken breast, cooked')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'More results' })).not.toBeInTheDocument();
});
