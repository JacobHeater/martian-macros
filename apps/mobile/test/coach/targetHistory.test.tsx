import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ExplanationLine } from '../../src/engine/ExplanationLine';
import type { TargetFlag } from '../../src/engine/TargetFlag';
import { TargetsExplanation } from '../../src/engine/TargetsExplanation';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openHeadsUp } from '../support/openHeadsUp';
import { openCoach as openCoachTab } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { topLayer } from '../support/topLayer';

/** MM-138: the history of targets, and keeping last week's targets once. Carried over from target_history_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

const record = (daysAgo: number, kcal: number, explanation?: TargetsExplanation, flags?: ReadonlySet<TargetFlag>) =>
  targetsFrom(today.addDays(-daysAgo), {
    kcal,
    carbsG: 240,
    tdeeKcal: 2900,
    tdeeSigmaKcal: 250,
    tdeeStatus: 'updated',
    ...(explanation === undefined ? {} : { explanation }),
    ...(flags === undefined ? {} : { flags }),
  });

const reduction = (from: number, to: number) =>
  new TargetsExplanation({
    lines: [new ExplanationLine('expenditureEstimate', to - from, { from: 2900, to: 2900 + to - from })],
    previousKcal: from,
    newKcal: to,
    estimateStatus: 'updated',
    usableIntakeDays: 12,
    weighIns: 11,
  });

async function seed(history: readonly TargetsRecord[]): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-90), healthCheckConfirmedOn: today }));
  for (let d = 20; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 82);
  for (const r of history) await repos.targets.saveTargets(r);
}

async function openCoach(): Promise<void> {
  renderApp(repos, today);
  await openCoachTab();
  await screen.findByRole('heading', { name: /^Last change/ });
}

async function openHistory(): Promise<void> {
  await openCoach();
  await userEvent.click(screen.getByRole('button', { name: 'History' }));
  await within(topLayer()).findByRole('heading', { name: 'Target history' });
}

async function seeWhy(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: 'See why' }));
  return screen.findByRole('dialog', { name: 'Why your targets are what they are' });
}

const hold = 'Keep last week’s targets for now';

it('the history lists every set of targets, newest first, and each opens its reasons', async () => {
  await seed(
    Array.from({ length: 6 }, (_, i) =>
      record(
        (5 - i) * 7,
        2400.0 - i * 25,
        i === 0 ? undefined : reduction(2400.0 - (i - 1) * 25, 2400.0 - i * 25),
        i === 3 ? new Set<TargetFlag>(['heldByUser']) : undefined,
      ),
    ),
  );
  await openHistory();

  const rows = within(topLayer()).getAllByRole('button', { name: / kcal · P 170/ });
  expect(rows).toHaveLength(6);
  expect(rows[0], 'newest').toHaveTextContent('2,275 kcal');
  expect(within(topLayer()).getAllByText(/Kept by you/)).toHaveLength(1);

  await userEvent.click(within(topLayer()).getByRole('button', { name: /2,375 kcal/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Why your targets are what they are' }));
  expect(sheet.getByText('What changed')).toBeInTheDocument();
  expect(sheet.getByText(/Calories 2,400 → 2,375/)).toBeInTheDocument();
});

it('an older record offers no hold, whatever it was', async () => {
  await seed([record(14, 2400), record(7, 2325, reduction(2400, 2325)), record(0, 2250, reduction(2325, 2250))]);
  await openHistory();
  await userEvent.click(within(topLayer()).getByRole('button', { name: /2,325 kcal/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Why your targets are what they are' }));
  expect(sheet.getByText('What changed')).toBeInTheDocument();
  expect(sheet.queryByRole('button', { name: hold })).not.toBeInTheDocument();
});

it('a reduction can be kept for now, once', async () => {
  await seed([record(7, 2400), record(0, 2325, reduction(2400, 2325))]);
  await openCoach();
  await userEvent.click(within(await seeWhy()).getByRole('button', { name: hold }));

  await expect
    .poll(async () => {
      const h = await first(repos.targets.watchTargetsHistory());
      return h[h.length - 1]?.targets.kcal;
    })
    .toBe(2400);
  const h = await first(repos.targets.watchTargetsHistory());
  expect(h, 'the day’s record was replaced').toHaveLength(2);
  expect(h[1]?.targets.flags).toEqual(new Set(['heldByUser']));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText(/Calories unchanged/)).not.toBeInTheDocument();
  await openHeadsUp();
  expect((await screen.findAllByText(/kept last week/)).length).toBeGreaterThan(0);
});

it('not offered on an increase', async () => {
  await seed([record(7, 2325), record(0, 2400, reduction(2325, 2400))]);
  await openCoach();
  const sheet = within(await seeWhy());
  expect(sheet.getByText('What changed')).toBeInTheDocument();
  expect(sheet.queryByRole('button', { name: hold })).not.toBeInTheDocument();
});

it('not offered the week after a hold', async () => {
  await seed([
    record(14, 2400),
    record(7, 2400, undefined, new Set<TargetFlag>(['heldByUser'])),
    record(0, 2325, reduction(2400, 2325)),
  ]);
  await openCoach();
  const sheet = within(await seeWhy());
  expect(sheet.getByText('What changed')).toBeInTheDocument();
  expect(sheet.queryByRole('button', { name: hold })).not.toBeInTheDocument();
});
