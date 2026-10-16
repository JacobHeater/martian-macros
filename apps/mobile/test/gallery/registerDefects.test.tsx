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
import { targetsFrom } from '../support/targetsFrom';

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

it('MM-333: a profile that cannot be read is said in words, never the raw error', async () => {
  renderApp(repos, today, { change: failingRead('setup', 'watchSetup') });
  expect(await screen.findByText(/Could not open your data/)).toBeInTheDocument();
  expect(screen.queryByText(/watchSetup/)).not.toBeInTheDocument();
});

it('MM-334: Food loading says nothing of pauses, and a failed pause read keeps the Dashboard', async () => {
  const waiting = renderApp(repos, today, { change: waitingRead('pauses', 'watchPauses') });
  await openTab('Food');
  expect(screen.queryByText(/pause history/i)).not.toBeInTheDocument();
  waiting.unmount();
  renderApp(repos, today, { change: failingRead('pauses', 'watchPauses') });
  expect(await screen.findAllByText(/^kcal /)).not.toHaveLength(0);
  expect(screen.getByText('Could not check whether today is paused')).toBeInTheDocument();
});

it('MM-335: the history under the Dashboard has no headline of its own and no cards inside the disclosure', async () => {
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

it('MM-337: an unknown barcode leaves one primary action on the sheet', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Scan');
  await typeIn(sheet, 'Or type the digits', '4006381333931');
  await press(sheet, 'Look up');
  await within(sheet).findByRole('button', { name: 'Read the label' });
  expect(sheet.querySelectorAll('.mm-button-primary')).toHaveLength(1);
});

it('MM-340: Coach with no weigh-in offers a way to log one', async () => {
  const empty = new InMemoryRepositories();
  await empty.preferences.saveThemePreference('martian');
  await empty.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-3), healthCheckConfirmedOn: today }));
  renderApp(empty, today);
  await openTab('Coach');
  await screen.findByText('Log a weigh-in to get started.');
  expect(screen.getByRole('button', { name: /weigh/i })).toBeInTheDocument();
});

it('MM-340: weighed in, and a record the coach needs unread: Coach says so, never a spinner for good', async () => {
  renderApp(repos, today, { change: failingRead('pauses', 'watchPauses') });
  await openTab('Coach');
  expect(await screen.findByText('Could not read what your coach works from')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

it.skip('MM-342: the last 7 days hold figures in their value column, not sentences', async () => {
  await repos.targets.saveTargets(targetsFrom(today.addDays(-20), { kcal: 2100 }));
  for (let i = 1; i <= 7; i++) {
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today.addDays(-i), meal: 'dinner', name: 'Day', kcal: 2600, proteinG: 150, carbsG: 250, fatG: 80, source: 'weighed' }),
    );
    await repos.dayMarks.setCompleteness(today.addDays(-i), 'complete');
  }
  renderApp(repos, today);
  await openTab('Coach');
  const label = await screen.findByText('Average intake');
  const value = label.parentElement?.lastElementChild?.textContent ?? '';
  expect(value.length).toBeLessThanOrEqual(16);
});

it('MM-344: the strength trends on Progress are rows of their section, not cards inside it', async () => {
  const { DemoSeed } = await import('../../src/fixtures/DemoSeed');
  const demo = new InMemoryRepositories();
  await new DemoSeed(today).replace(demo);
  renderApp(demo, today);
  await openTab('Progress');
  const section = (await screen.findByRole('heading', { name: 'Strength trends' })).closest('.mm-section') as HTMLElement;
  await within(section).findAllByText(/^Est\. max /);
  expect(section.querySelector('.mm-info-card, .mm-surface')).toBeNull();
});

it('MM-347: a failed save of the look is said outside the list of Settings rows', async () => {
  const { failingWrite } = await import('../../src/gallery/screens/failingWrite');
  const { openSettings } = await import('../support/openSettings');
  renderApp(repos, today, { change: failingWrite('preferences', 'saveThemePreference') });
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: 'Change appearance' }));
  await userEvent.click(await screen.findByText('Light'));
  const notice = await screen.findByText('Your appearance could not be saved. Nothing was changed.');
  expect(notice.closest('.mm-list-group')).toBeNull();
});
