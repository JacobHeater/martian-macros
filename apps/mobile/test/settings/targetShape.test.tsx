import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CarbFatBalance } from '../../src/domain/CarbFatBalance';
import { TargetShape } from '../../src/domain/TargetShape';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { topLayer } from '../support/topLayer';

/** MM-122, MM-124: Settings > Coach opens the balance of carbs and fat and the week's shape; both start as the app set them. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function openRow(name: RegExp) {
  renderApp(repos, today);
  await openSettings();
  const heading = within(topLayer()).getByRole('heading', { level: 2, name: 'Coach' });
  const header = within(heading).getByRole('button');
  if (header.getAttribute('aria-expanded') === 'false') await userEvent.click(header);
  await userEvent.click(await screen.findByRole('button', { name }));
}

const shapeToday = async () => TargetShape.on(await first(repos.targetShapes.watchTargetShapes()), today);

it('the balance is unchosen until a position is chosen, and then kept from today', async () => {
  await openRow(/^Carbs and fat balance/);
  expect(await screen.findByText(/As the app set it until you choose/)).toBeInTheDocument();
  expect(screen.getByText('For fat loss and muscle, this balance matters much less than calories and protein. Pick what you like eating.')).toBeInTheDocument();
  expect(await shapeToday()).toBeUndefined();
  await userEvent.click(screen.getByRole('button', { name: 'More fat' }));
  await expect.poll(async () => (await shapeToday())?.balance?.fatShare).toBe(CarbFatBalance.moreFatFatShare);
  expect((await shapeToday())?.since).toBe(today);
});

// The notice that fat gave way to the carb floor speaks of "the share you chose": never before a choice.
it('the carb floor notice appears only after a balance is chosen', async () => {
  // So little after protein that MM-24's split puts fat at its minimum and More fat meets the carb floor.
  await repos.targets.saveTargets(targetsFrom(today.addDays(-7), { kcal: 1500, proteinG: 300, fatG: 40, carbsG: 0 }));
  await openRow(/^Carbs and fat balance/);
  expect(await screen.findByText(/As the app set it until you choose/)).toBeInTheDocument();
  expect(screen.queryByText(/so carbs can stay at 100 g/)).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'More fat' }));
  expect(await screen.findByText(/so carbs can stay at 100 g/)).toBeInTheDocument();
});

it('the carb floor is switched off only on purpose', async () => {
  await openRow(/^Carbs and fat balance/);
  const floor = await screen.findByRole('switch', { name: /^I eat very low carb on purpose/ });
  expect(floor).not.toBeChecked();
  await userEvent.click(floor);
  await expect.poll(async () => (await shapeToday())?.balance?.carbFloorOff).toBe(true);
});

it('the week is flat until a higher day is chosen, holds three at most, and never offers to make up a day', async () => {
  await openRow(/^Week shape/);
  expect(await screen.findByText('None: every day has the same target.')).toBeInTheDocument();
  for (const day of ['Friday', 'Saturday', 'Sunday']) {
    await userEvent.click(screen.getByRole('button', { name: day }));
    await expect.poll(async () => (await shapeToday())?.week.higherDays.size).toBe(['Friday', 'Saturday', 'Sunday'].indexOf(day) + 1);
  }
  await userEvent.click(screen.getByRole('button', { name: 'Monday' }));
  expect(await screen.findByText(/Up to 3 higher days/)).toBeInTheDocument();
  expect([...((await shapeToday())?.week.higherDays ?? [])]).toEqual([0, 5, 6]);
  expect(screen.queryByText(/make (it )?up for|left for the week|banked/i)).toBeNull();
});
