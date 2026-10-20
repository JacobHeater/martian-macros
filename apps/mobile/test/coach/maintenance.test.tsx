import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-130: maintenance said plainly: the rebound before it happens, the pause before another cut, the anchor, and the drift question. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/** A twelve-week cut that ended `daysAgo` days ago; weighed flat, then up `reboundKg`, then `driftKg` more from day 20. */
async function afterCut({ daysAgo, reboundKg = 1, driftKg = 0 }: { daysAgo: number; reboundKg?: number; driftKg?: number }): Promise<void> {
  const cutStart = today.addDays(-daysAgo - 84);
  const start = today.addDays(-daysAgo);
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: cutStart.addDays(-14), healthCheckConfirmedOn: today, goalMode: 'maintenance' }));
  await repos.targets.saveTargets(targetsFrom(cutStart, { kcal: 2000, tdeeKcal: 2700, tdeeStatus: 'updated' }));
  await repos.targets.saveTargets(
    targetsFrom(start, { kcal: 2650, mode: 'maintenance', weeklyRateFraction: 0, tdeeKcal: 2650, tdeeStatus: 'updated' }),
  );
  for (let i = 0; i <= daysAgo + 40; i++) {
    const day = today.addDays(-i);
    const since = start.daysUntil(day);
    let kg = 80;
    if (since > 0) kg += reboundKg * Math.min(1, since / 10);
    if (since > 20) kg += driftKg * Math.min(1, (since - 20) / 10);
    await repos.weights.saveWeight(day, kg);
    if (i === 0) continue;
    const kcal = since > 0 ? 2650 : 2000;
    await repos.food.addFood(foodOn(day, { name: 'Day', meal: 'dinner', kcal, proteinG: 150, carbsG: 250, fatG: 75 }));
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
}

it('four days after a cut: the scale is explained before it rises, and a pause before another cut is suggested', async () => {
  await afterCut({ daysAgo: 4 });
  renderApp(repos, today);
  await openTab('Coach');
  const card = (await screen.findByRole('heading', { name: 'Maintaining' })).closest('.mm-section') as HTMLElement;
  expect(within(card).getByText(/^Expect the scale to rise 1 to 4 lb over the next week or two/)).toBeInTheDocument();
  expect(within(card).getByText(/stored carbohydrate and water returning, not fat/)).toBeInTheDocument();
  expect(within(card).getByText(/A cut of 12 weeks ended 4 days ago. About 3 weeks here before another is a sensible pause/)).toBeInTheDocument();
  expect(within(card).getByText(/read from your trend 14 days in/)).toBeInTheDocument();
});

it('the same line sits under the weigh-in on Today for two weeks', async () => {
  await afterCut({ daysAgo: 4 });
  renderApp(repos, today);
  expect(await screen.findByText(/^Expect the scale to rise/)).toBeInTheDocument();
});

it('after two weeks the line is gone and the anchor is the trend two weeks in, with its band', async () => {
  await afterCut({ daysAgo: 42 });
  renderApp(repos, today);
  await openTab('Coach');
  const card = (await screen.findByRole('heading', { name: 'Maintaining' })).closest('.mm-section') as HTMLElement;
  expect(within(card).queryByText(/^Expect the scale to rise/)).not.toBeInTheDocument();
  expect(within(card).getByText('Anchor')).toBeInTheDocument();
  expect(within(card).getByText('Band')).toBeInTheDocument();
  expect(within(card).getByText('Within the band: holding.')).toBeInTheDocument();
});

it('drifted out for two weeks the coach asks, changes nothing until answered, and keeps the answer', async () => {
  await afterCut({ daysAgo: 60, driftKg: 2.5 });
  renderApp(repos, today);
  await openTab('Coach');
  const card = (await screen.findByRole('heading', { name: 'Maintaining' })).closest('.mm-section') as HTMLElement;
  expect(await within(card).findByText('Your weight has moved')).toBeInTheDocument();
  expect(within(card).getByText(/Nothing changes until you choose/)).toBeInTheDocument();
  const words = card.textContent?.toLowerCase() ?? '';
  for (const word of ['fail', 'slip', 'bad', 'should', 'must']) expect(words).not.toContain(word);
  await userEvent.click(within(card).getByRole('button', { name: 'Accept the new weight' }));
  await expect.poll(async () => (await repos.setup.loadSetup())?.maintenanceAnchorOn).toBe(today);
  expect(await within(card).findByText('Within the band: holding.')).toBeInTheDocument();
});

it('correct back runs a gentle pace toward the anchor', async () => {
  await afterCut({ daysAgo: 60, driftKg: 2.5 });
  renderApp(repos, today);
  await openTab('Coach');
  const card = (await screen.findByRole('heading', { name: 'Maintaining' })).closest('.mm-section') as HTMLElement;
  await userEvent.click(await within(card).findByRole('button', { name: 'Correct back' }));
  await expect.poll(async () => (await repos.setup.loadSetup())?.maintenanceCorrectionFrom).toBe(today);
  expect(await within(card).findByText(/Correcting back toward/)).toBeInTheDocument();
});
