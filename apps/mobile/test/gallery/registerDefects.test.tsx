import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { failingRead } from '../../src/gallery/screens/failingRead';
import { waitingRead } from '../../src/gallery/screens/waitingRead';
import { openAddFood, press, typeIn } from '../support/addFood';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * Design defects found drawing the Food and Dashboard states no story drew (MM-321). Each is skipped
 * with its ticket's ID until its fix has been through Storybook and the panel.
 */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

it.skip('MM-333: a profile that cannot be read is said in words, never the raw error', async () => {
  renderApp(repos, today, { change: failingRead('setup', 'watchSetup') });
  expect(await screen.findByText(/Could not open your data/)).toBeInTheDocument();
  expect(screen.queryByText(/watchSetup/)).not.toBeInTheDocument();
});

it.skip('MM-334: Food loading says nothing of pauses, and a failed pause read keeps the Dashboard', async () => {
  const waiting = renderApp(repos, today, { change: waitingRead('pauses', 'watchPauses') });
  await openTab('Food');
  expect(screen.queryByText(/pause history/i)).not.toBeInTheDocument();
  waiting.unmount();
  renderApp(repos, today, { change: failingRead('pauses', 'watchPauses') });
  expect(await screen.findByText(/kcal left/)).toBeInTheDocument();
});

it.skip('MM-335: the history under the Dashboard has no headline of its own and no cards inside the disclosure', async () => {
  renderApp(repos, today);
  await dashboardLoaded();
  const more = screen.getByRole('button', { name: /More about this week/ });
  await userEvent.click(more);
  expect(screen.queryByRole('heading', { name: 'Your metrics' })).not.toBeInTheDocument();
});

it.skip('MM-336: the alcohol of the day is said inside the screen hierarchy, not bare on the canvas', async () => {
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today, meal: 'dinner', name: 'Red wine', kcal: 125, proteinG: 0, carbsG: 4, fatG: 0, source: 'weighed', alcoholG: 15.6 }),
  );
  renderApp(repos, today);
  await openTab('Food');
  const line = await screen.findByText(/^Alcohol: /);
  expect(line.closest('.mm-section, .food-hero')).not.toBeNull();
});

it.skip('MM-337: an unknown barcode leaves one primary action on the sheet', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Scan');
  await typeIn(sheet, 'Or type the digits', '4006381333931');
  await press(sheet, 'Look up');
  await within(sheet).findByRole('button', { name: 'Read the label' });
  expect(sheet.querySelectorAll('.mm-button-primary')).toHaveLength(1);
});
