import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openAddFood } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-330: a search the pack has nothing for, but the person's own foods do, never says "Nothing found". */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const search = async (text: string) => {
  renderApp(repos, today, { change: withCatalog(await fixtureCatalog()) });
  await openTab('Food');
  const sheet = await openAddFood();
  await userEvent.type(sheet.querySelector('input') as HTMLInputElement, text);
};

it('a match among the person own foods is not followed by "Nothing found"', async () => {
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Overnight oats',
      kind: 'food',
      servingDescription: '1 jar',
      perServing: new NutritionTotals({ kcal: 410, proteinG: 24, carbsG: 52, fatG: 11 }),
    }),
  );
  await search('overnight');
  expect(await screen.findByText('Overnight oats')).toBeInTheDocument();
  expect(screen.queryByText(/^Nothing found for/)).not.toBeInTheDocument();
});

it('a search nothing matches still says so', async () => {
  await search('zzqx');
  expect(await screen.findByText('Nothing found for "zzqx".')).toBeInTheDocument();
});
