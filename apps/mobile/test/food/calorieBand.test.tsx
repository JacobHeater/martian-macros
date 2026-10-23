import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { FoodEntry } from '../../src/domain/FoodEntry';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-123: targets that admit how well food can be measured: rounded figures, a band, and one line about labels. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

const day = (kcal: number): FoodEntry => foodOn(today, { name: 'The day', meal: 'lunch', kcal, proteinG: 150, carbsG: 200, fatG: 70 });

async function seed({ history, foods = [] }: { history: readonly TargetsRecord[]; foods?: readonly FoodEntry[] }): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  for (const h of history) await repos.targets.saveTargets(h);
  for (const f of foods) await repos.food.addFood(f);
}

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('button', { name: 'Previous day' });
}

it('a computed target of 2,473 kcal and 172 g of protein shows as 2,475 and 170', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2473, proteinG: 172 })] });
  await openFood();
  expect(await screen.findByText('left of 2,475')).toBeInTheDocument();
  expect(screen.getByText('2,475')).toBeInTheDocument();
  expect(screen.getByText(/0 \/ 170 g/)).toBeInTheDocument();
});

it('with exact targets on, 2,473 is shown and the band is unchanged', async () => {
  await repos.preferences.saveExactTargets(true);
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2473 })], foods: [day(2400)] });
  await openFood();
  expect(await screen.findByText('left of 2,473 · on target')).toBeInTheDocument();
  expect(screen.getByText('73')).toBeInTheDocument();
});

it('inside the band the card says on target, below it says what is left, above it says over', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2400 })], foods: [day(2310)] });
  await openFood();
  expect(await screen.findByText('left of 2,400 · on target')).toBeInTheDocument();
  expect(screen.getByText('90')).toBeInTheDocument();
});

it('below the band: what is left, with no judgement', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2400 })], foods: [day(2200)] });
  await openFood();
  expect(await screen.findByText('left of 2,400')).toBeInTheDocument();
  expect(screen.getByText('200')).toBeInTheDocument();
  expect(screen.queryByText(/on target/)).not.toBeInTheDocument();
});

it('above the band: over', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2400 })], foods: [day(2560)] });
  await openFood();
  expect(await screen.findByText('over 2,400')).toBeInTheDocument();
  expect(screen.getByText('160')).toBeInTheDocument();
});

it('a smaller target has a band of 100 kcal either side, never narrower', async () => {
  // 5% of 2,000 is 100: the band is 1,900 to 2,100.
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2000 })], foods: [day(1901)] });
  await openFood();
  expect(await screen.findByText('left of 2,000 · on target')).toBeInTheDocument();
});

it('a day below the calorie floor is never on target (MM-114)', async () => {
  // The band of a 1,400 target reaches down to 1,300, but 1,301 kcal is under the floor of this person.
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 1400 })], foods: [day(1301)] });
  await openFood();
  expect(await screen.findByText('left of 1,400')).toBeInTheDocument();
  expect(screen.queryByText(/on target/)).not.toBeInTheDocument();
});

it('the band is drawn on the arc as a zone', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2400 })], foods: [day(2310)] });
  await openFood();
  await screen.findByText(/on target/);
  expect(document.querySelector('.chart-intake-band')).not.toBeNull();
});

it('carbohydrate and fat are never judged', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40), { kcal: 2400 })], foods: [day(2310)] });
  await openFood();
  await screen.findByText(/on target/);
  for (const word of [/carbs.*(over|under|hit|missed)/i, /fat.*(over|under|hit|missed)/i]) {
    expect(screen.queryByText(word)).not.toBeInTheDocument();
  }
});

it('the line about labels is said once, until dismissed', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40))] });
  await openFood();
  expect(await screen.findByText(/Food labels and portions are only accurate to within about 10 to 20%. Close counts as exact./)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
  expect(await first(repos.preferences.watchLabelNoteDismissedOn())).toBe(today);
  await expect.poll(() => screen.queryByText(/Food labels and portions/)).toBeNull();
});
