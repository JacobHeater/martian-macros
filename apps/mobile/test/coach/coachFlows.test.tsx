import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/**
 * MM-93: Coach flows, and the first adaptive check-in driven through the
 * app with stored data (MM-24). Carried over from coach_flows_test.dart.
 */
async function seedHistory(days: number, dayOneKcal: number): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-days), healthCheckConfirmedOn: today }));
  for (let d = days; d >= 0; d--) {
    const date = today.addDays(-d);
    await repos.weights.saveWeight(date, 82.0 + (d % 2 === 0 ? 0.2 : -0.2));
    await repos.food.addFood(
      foodOn(date, { name: `Day ${d}`, meal: 'lunch', kcal: 2600, proteinG: 160, carbsG: 280, fatG: 80 }),
    );
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-days), { kcal: dayOneKcal, proteinG: 160, tdeeKcal: 2600 }),
  );
}

async function chooseMaintenance(): Promise<void> {
  await openTab('Coach');
  expect(await screen.findByRole('heading', { name: 'Goal: Fat loss' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Change goal' }));
  const sheet = await screen.findByRole('dialog', { name: 'Choose a goal' });
  await userEvent.click(within(sheet).getByText('Maintenance'));
}

// MM-299: the goal is the first section, under the hero and its warnings, before the one thing to do.
it('puts the goal first under the hero, before the one thing to do', async () => {
  await seedHistory(30, 2600);
  renderApp(repos, today);
  await openTab('Coach');
  const goal = await screen.findByRole('heading', { name: 'Goal: Fat loss' });
  const oneThing = await screen.findByText('Answer this week’s five questions');
  const hero = document.querySelector('.mm-hero') as HTMLElement;
  const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  expect(follows(hero, goal)).toBe(true);
  expect(follows(goal, oneThing)).toBe(true);
  expect(document.querySelector('.mm-section')?.contains(goal)).toBe(true);
  expect(screen.getByRole('button', { name: 'Change goal' })).toBeInTheDocument();
});

it('changing the goal applies at once', async () => {
  await seedHistory(30, 2500);
  renderApp(repos, today);
  await chooseMaintenance();
  expect(await screen.findByRole('heading', { name: 'Goal: Maintenance' })).toBeInTheDocument();
  expect((await repos.setup.loadSetup())?.goalMode).toBe('maintenance');
});

it('targets follow a goal change in the app', async () => {
  await seedHistory(30, 2000);
  const view = renderApp(repos, today);
  await chooseMaintenance();
  await screen.findByRole('heading', { name: 'Goal: Maintenance' });
  let history = await first(repos.targets.watchTargetsHistory());
  await expect
    .poll(async () => {
      history = await first(repos.targets.watchTargetsHistory());
      return history[history.length - 1]?.mode;
    })
    .toBe('maintenance');
  expect(history.length).toBeGreaterThanOrEqual(2);
  expect((history[history.length - 1]?.targets.kcal ?? 0) - (history[0]?.targets.kcal ?? 0)).toBeGreaterThan(100);
  // A change made this launch waits until the next opening.
  expect(screen.queryByRole('dialog', { name: 'Why your targets are what they are' })).not.toBeInTheDocument();

  view.unmount();
  renderApp(repos, today);
  expect(await screen.findByRole('dialog', { name: 'Why your targets are what they are' })).toBeInTheDocument();
});

it('the first adaptive check-in runs through the app', async () => {
  // Thirty days of complete logs at maintenance; targets issued on day one.
  await seedHistory(30, 2600);
  renderApp(repos, today);
  await screen.findByRole('navigation', { name: 'Destinations' });
  await expect.poll(async () => (await first(repos.targets.watchTargetsHistory())).length).toBe(2);
  const history = await first(repos.targets.watchTargetsHistory());
  expect(history[1]?.effectiveFrom).toBe(today);
  expect(history[1]?.tdeeStatus).toBe('updated');
});

/** MM-139: confidence is shown in words and the estimate is one tap away. From coach_confidence_widget_test.dart. */
it('Learning explains the target hold and what to do next', async () => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  renderApp(repos, today);
  expect(
    await screen.findByText('Calibration, day 1 of 14. Targets hold while the app learns your metabolism.'),
  ).toBeInTheDocument();
  // The confidence word is said with its label, never alone (MM-254).
  expect(within(document.querySelector('.mm-hero') as HTMLElement).getByText('Coach confidence: Learning')).toBeInTheDocument();

  await openTab('Coach');
  expect(await screen.findByText(/^About .* so far$/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Coach confidence · Learning' })).toBeInTheDocument();
  expect(screen.getByText('Targets are held while the coach learns.')).toBeInTheDocument();
  expect(screen.getByText(/Log food and mark days complete/)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('score');

  await userEvent.click(screen.getByRole('button', { name: /Your metabolism estimate/ }));
  expect(await screen.findByText(/Probably between/)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('±');
});

/** MM-187: the arc is the one calorie visual. From one_calorie_visual_test.dart; the Food screen's is with its own tests. */
async function seedArc(): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-3), { kcal: 2000, proteinG: 160, carbsG: 200, tdeeKcal: 2600, tdeeSigmaKcal: 300 }),
  );
}

const arcs = () => document.querySelectorAll('.app-layer:not([hidden]) .mm-horizon');

for (const tab of ['Dashboard', 'Coach']) {
  it(`${tab} shows exactly one arc`, async () => {
    await seedArc();
    renderApp(repos, today);
    if (tab !== 'Dashboard') await openTab(tab);
    await screen.findByText(/kcal left of 2,000/);
    expect(arcs()).toHaveLength(1);
  });
}

it('the Coach screen has no calorie figure of its own', async () => {
  await seedArc();
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText(/kcal left of 2,000/)).toBeInTheDocument();
  // The old hero card said "kcal a day" under a figure of its own.
  expect(screen.queryByText('kcal a day')).not.toBeInTheDocument();
  expect(screen.queryByText('Daily targets')).not.toBeInTheDocument();
});

it('during a pause the Coach arc is the guide, never over', async () => {
  await seedArc();
  await repos.pauses.savePause(new Pause({ from: today.addDays(-1), to: today.addDays(4), reason: 'travel' }));
  await repos.food.addFood(
    foodOn(today, { name: 'Wedding dinner', kcal: 3400, proteinG: 120, carbsG: 380, fatG: 140 }),
  );
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText(/paused, guide/)).toBeInTheDocument();
  expect(arcs()).toHaveLength(1);
  expect(screen.queryByText(/kcal over/)).not.toBeInTheDocument();
});
