import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-692 (the owner, from the phone): the day's completeness is a chip with a fill at the top right of the Food
 * hero, in every state, and no longer a wordless mark beside the day in the header. The row after the meals stays
 * the control (MM-255).
 */
const today = CalendarDate.of(2026, 10, 18);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 400, proteinG: 14, carbsG: 60, fatG: 8 }));
});

const hero = () => document.querySelector('.mm-hero') as HTMLElement;

const chipIn = (root: HTMLElement, label: string) => within(root).queryByText(label, { selector: '.mm-chip-status' });

it('an unmarked day shows "Not marked" in the hero, and the header carries no completeness mark', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const chip = await within(hero()).findByText('Not marked', { selector: '.mm-chip-status' });
  expect(chip).toHaveClass('mm-chip-neutral');
  // The chip stands in the head's right side, beside the day's figure.
  expect(chip.closest('.food-hero-head')).not.toBeNull();
  expect(screen.queryByRole('img', { name: /^(Marked complete|Marked partial|Not marked)$/ })).toBeNull();
  expect(document.querySelector('.food-day-header .mm-chip-status')).toBeNull();
});

it('a day marked complete shows the positive "Complete" chip; marked partial, the caution "Partial" one', async () => {
  await repos.dayMarks.setCompleteness(today, 'complete');
  await repos.dayMarks.setCompleteness(today.addDays(-1), 'partial');
  await repos.food.addFood(foodOn(today.addDays(-1), { name: 'Rice', meal: 'lunch', kcal: 300, proteinG: 6, carbsG: 60, fatG: 2 }));
  renderApp(repos, today);
  await openTab('Food');
  const complete = await within(hero()).findByText('Complete', { selector: '.mm-chip-status' });
  expect(complete).toHaveClass('mm-chip-positive');
  expect(chipIn(hero(), 'Not marked')).toBeNull();

  await userEvent.click(screen.getByRole('button', { name: /previous day/i }));
  const partial = await within(hero()).findByText('Partial', { selector: '.mm-chip-status' });
  expect(partial).toHaveClass('mm-chip-caution');
});

it('answering the row after the meals changes the chip', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await within(hero()).findByText('Not marked', { selector: '.mm-chip-status' });
  await userEvent.click(await screen.findByRole('button', { name: /^Is this day fully logged\?/ }));
  const options = await screen.findByRole('dialog', { name: 'Is this day fully logged?' });
  await userEvent.click(within(options).getByRole('option', { name: /^Partial/ }));
  await expect.poll(() => first(repos.dayMarks.watchCompleteness(today))).toBe('partial');
  const chip = await within(hero()).findByText('Partial', { selector: '.mm-chip-status' });
  expect(chip).toHaveClass('mm-chip-caution');
  expect(chipIn(hero(), 'Not marked')).toBeNull();
});
