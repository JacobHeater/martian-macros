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
import { targetsFrom } from '../support/targetsFrom';

/** MM-559: "Check in now" on the Coach works the targets out again now from the latest weigh-in. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/** A month of logging; the last weigh-in `lastWeighInDaysAgo` days ago; targets three days old at `kcal`. */
async function seed({ lastWeighInDaysAgo = 0, kcal = 1500 }: { lastWeighInDaysAgo?: number; kcal?: number } = {}): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  for (let d = 30; d >= 0; d--) {
    const date = today.addDays(-d);
    if (d >= lastWeighInDaysAgo) await repos.weights.saveWeight(date, 90 - d * 0.03);
    await repos.food.addFood(foodOn(date, { name: `Day ${d}`, meal: 'lunch', kcal: 2300, proteinG: 160, carbsG: 250, fatG: 70 }));
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  await repos.targets.saveTargets(targetsFrom(today.addDays(-3), { kcal, proteinG: 160, tdeeKcal: 2900 }));
}

const history = () => first(repos.targets.watchTargetsHistory());

it('shows the new targets beside the current ones and keeps them only when asked', async () => {
  await seed();
  renderApp(repos, today);
  await openTab('Coach');
  const button = await screen.findByRole('button', { name: 'Check in now' });
  expect(button).toBeEnabled();
  await userEvent.click(button);
  const sheet = await screen.findByRole('dialog', { name: 'Check in' });
  expect(within(sheet).getByText(/^1,500 kcal → /)).toBeInTheDocument();
  expect(within(sheet).getByText(/You checked in from your latest weight/)).toBeInTheDocument();
  // Keeping the current targets changes nothing.
  await userEvent.click(within(sheet).getByRole('button', { name: 'Keep current targets' }));
  expect(await history()).toHaveLength(1);

  await userEvent.click(screen.getByRole('button', { name: 'Check in now' }));
  const again = await screen.findByRole('dialog', { name: 'Check in' });
  await userEvent.click(within(again).getByRole('button', { name: 'Use new targets' }));
  await expect.poll(async () => (await history()).length).toBe(2);
  const [, after] = await history();
  expect(after?.effectiveFrom).toBe(today);
  // The whole change at once: the weekly step limit is 100 kcal.
  expect((after?.targets.kcal ?? 0) - 1500).toBeGreaterThan(100);
  expect(after?.explanation?.lines.some((line) => line.reason === 'recalculation')).toBe(true);
  // Seen in the sheet, so no summary follows on the next opening.
  expect(after?.summarySeen).toBe(true);
  expect(await screen.findByText(/^New targets in force\. Next check-in/)).toBeInTheDocument();
  // Changed today: off until tomorrow, and it says so.
  expect(await screen.findByText('Your targets already changed today. You can check in again tomorrow.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Check in now' })).toBeDisabled();
});

it('is off, with an info notice saying why, without a weigh-in from the last seven days', async () => {
  await seed({ lastWeighInDaysAgo: 8 });
  renderApp(repos, today);
  await openTab('Coach');
  const button = await screen.findByRole('button', { name: 'Check in now' });
  expect(button).toBeDisabled();
  const note = screen.getByText(/your last weigh-in is more than 7 days old\. Weigh in to turn it on\./);
  expect(note).toBeInTheDocument();
  expect(button).toHaveAccessibleDescription(/more than 7 days old/);
  await userEvent.click(button);
  expect(screen.queryByRole('dialog', { name: 'Check in' })).not.toBeInTheDocument();
});

it('a weigh-in six days old is recent enough', async () => {
  await seed({ lastWeighInDaysAgo: 6 });
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByRole('button', { name: 'Check in now' })).toBeEnabled();
});
