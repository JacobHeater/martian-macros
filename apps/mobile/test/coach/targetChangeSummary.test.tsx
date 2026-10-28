import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ExplanationLine } from '../../src/engine/ExplanationLine';
import { TargetsExplanation } from '../../src/engine/TargetsExplanation';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { topLayer } from '../support/topLayer';
import { dashboardLoaded } from '../support/dashboardLoaded';

/** MM-138: a change to the targets is summarized once, on the next opening. From target_change_summary_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
const previousDay = today.addDays(-4);
const changeDay = today.addDays(-1);

const target = (
  effectiveFrom: CalendarDate,
  kcal: number,
  { protein = 150, explanation, summarySeen = true }: { protein?: number; explanation?: TargetsExplanation; summarySeen?: boolean } = {},
) =>
  targetsFrom(effectiveFrom, {
    kcal,
    proteinG: protein,
    proteinMinimumG: 120,
    fatG: 65,
    carbsG: 180,
    tdeeKcal: 2500,
    tdeeSigmaKcal: 180,
    tdeeStatus: 'updated',
    summarySeen,
    ...(explanation === undefined ? {} : { explanation }),
  });

async function seeded(): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(target(previousDay, 2200));
  return repos;
}

const summary = () => screen.findByRole('dialog', { name: 'Why your targets are what they are' });

it('a macro-only target change is shown on the next app opening', async () => {
  const repos = await seeded();
  await repos.targets.saveTargets(
    target(changeDay, 2200, {
      protein: 160,
      summarySeen: false,
      explanation: new TargetsExplanation({ lines: [], previousKcal: 2200, newKcal: 2200, estimateStatus: 'updated' }),
    }),
  );

  renderApp(repos, today);
  expect(within(await summary()).getByText(/Protein target 150 → 160 g/)).toBeInTheDocument();
});

it('an unseen target change is shown once and remains in history', async () => {
  const repos = await seeded();
  await repos.targets.saveTargets(
    target(changeDay, 2150, {
      summarySeen: false,
      explanation: new TargetsExplanation({
        lines: [new ExplanationLine('stepLimit', -50)],
        previousKcal: 2200,
        newKcal: 2150,
        estimateStatus: 'updated',
        usableIntakeDays: 20,
        weighIns: 20,
      }),
    }),
  );
  const last = async () => {
    const saved = await first(repos.targets.watchTargetsHistory());
    return saved[saved.length - 1];
  };

  let view = renderApp(repos, today);
  expect(within(await summary()).getByText(/Weekly changes are limited/)).toBeInTheDocument();
  expect((await last())?.summarySeen).toBe(false);

  // Closing the app with the summary still open does not count as seeing it.
  view.unmount();
  expect((await last())?.summarySeen).toBe(false);

  view = renderApp(repos, today);
  await summary();
  await userEvent.keyboard('{Escape}');
  await expect.poll(async () => (await last())?.summarySeen).toBe(true);
  expect((await last())?.explanation?.lines).toHaveLength(1);

  view.unmount();
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.queryByRole('dialog', { name: 'Why your targets are what they are' })).not.toBeInTheDocument();

  await openCoach();
  await userEvent.click(await screen.findByRole('button', { name: 'History' }));
  expect(await within(topLayer()).findByRole('heading', { name: 'Target history' })).toBeInTheDocument();
  await userEvent.click(within(topLayer()).getAllByRole('button', { name: /kcal · P/ })[0] as HTMLElement);
  expect(await summary()).toBeInTheDocument();
});
