import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryHaptics } from '../../src/fixtures/InMemoryHaptics';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-661 (the owner, 2026-10-27): a long press on a food starts choosing with
 * that food ticked and one tap under the finger; a short press still opens
 * the food; a finger that drifts is not holding. The hold is half a second
 * of real time here, as on the phone.
 */
const today = CalendarDate.of(2026, 10, 27);
let repos: InMemoryRepositories;
let haptics: InMemoryHaptics;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  haptics = new InMemoryHaptics();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 300, proteinG: 10, carbsG: 50, fatG: 6 }));
  await repos.food.addFood(foodOn(today, { name: 'Banana', meal: 'breakfast', kcal: 105, proteinG: 1, carbsG: 27, fatG: 0 }));
});

const open = async () => {
  renderApp(repos, today, { change: (services) => ({ ...services, haptics }) });
  await openTab('Food');
  return screen.findByRole('button', { name: 'Edit Oats' });
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const at = { clientX: 100, clientY: 100, pointerId: 1 };

it('a long press starts choosing with that food ticked, and taps once', async () => {
  const row = await open();
  fireEvent.pointerDown(row, at);
  await wait(650);
  fireEvent.pointerUp(row, at);
  // The press that follows the hold, as a phone sends it, is not a press.
  fireEvent.click(row);
  expect(await screen.findByRole('checkbox', { name: /^Oats · 300 kcal/ })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /^Banana/ })).not.toBeChecked();
  expect(screen.queryByRole('dialog', { name: 'Edit food' })).toBeNull();
  expect(haptics.taps).toBe(1);
});

it('a short press opens the food, with no tap', async () => {
  const row = await open();
  fireEvent.pointerDown(row, at);
  await wait(100);
  fireEvent.pointerUp(row, at);
  await userEvent.click(row);
  expect(await screen.findByRole('dialog', { name: 'Edit food' })).toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(haptics.taps).toBe(0);
});

it('a finger that drifts, as a swipe begins, is not holding', async () => {
  const row = await open();
  fireEvent.pointerDown(row, at);
  fireEvent.pointerMove(row, { ...at, clientX: 80 });
  await wait(650);
  fireEvent.pointerUp(row, { ...at, clientX: 80 });
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(haptics.taps).toBe(0);
});
