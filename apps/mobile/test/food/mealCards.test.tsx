import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { declarationsOf } from '../support/stylesheetRules';

/** MM-569: the meals read as cards like the hero, their rows on the header's columns. */
const today = CalendarDate.of(2026, 10, 10);

it('each meal and the water are framed cards whose rows run on the header’s columns', async () => {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.food.addFood(foodOn(today, { name: 'Eggs', meal: 'breakfast', kcal: 140 }));
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Eggs');
  for (const name of ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Water']) {
    const section = screen.getByRole('region', { name });
    expect(section, name).toHaveClass('mm-section-framed', 'mm-section-flush');
  }
  // The row's icon is as wide as the meal's mark and keeps the header's gap, so the name sits under the title.
  expect(declarationsOf('src/ui/ui.css', '.mm-section-flush > .mm-section-body')).toMatch(/padding-left: 0/);
  expect(declarationsOf('src/food/food.css', '.food-entry-method')).toMatch(/width: 24px/);
  expect(declarationsOf('src/food/food.css', '.food-entry')).toMatch(/gap: var\(--space-12\)/);
  expect(declarationsOf('src/ui/ui.css', '.mm-section-head-body')).toMatch(/gap: var\(--space-12\)/);
  // The owner, 2026-10-22: each row drew a flat box over the card's sheen. At rest a row has no ground of its own.
  expect(declarationsOf('src/ui/ui.css', '.mm-swipe-row')).not.toMatch(/background/);
  const row = document.querySelector('.mm-swipe');
  expect(row).not.toHaveClass('mm-swipe-moving');
});
