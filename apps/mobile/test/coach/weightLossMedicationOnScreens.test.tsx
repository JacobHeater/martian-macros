import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import type { TargetFlag } from '../../src/engine/TargetFlag';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { openHeadsUp } from '../support/openHeadsUp';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/**
 * MM-510: the weight-loss medication answer read by every screen MM-113
 * names. Ticked, each MM-113 scenario holds on its screen; not ticked, none
 * of them applies. The broader weight-affecting medication answer changes
 * none of this.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function seed({
  screening = new ScreeningAnswers(),
  trainingDaysPerWeek = 3,
  raisedForSafePace = false,
  todayKcal,
  lowDays = 0,
}: {
  screening?: ScreeningAnswers;
  trainingDaysPerWeek?: number;
  raisedForSafePace?: boolean;
  todayKcal?: number;
  lowDays?: number;
} = {}): Promise<void> {
  const setup = typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today, screening });
  await repos.setup.saveSetup(setup.copyWith({ trainingDaysPerWeek }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(targetsFrom(today.addDays(-40), { kcal: 1900, proteinG: 160, proteinMinimumG: 130 }));
  if (raisedForSafePace) {
    await repos.targets.saveTargets(
      targetsFrom(today.addDays(-3), { kcal: 1900, proteinG: 160, proteinMinimumG: 130, flags: new Set<TargetFlag>(['raisedForSafePace']) }),
    );
  }
  if (todayKcal !== undefined) {
    await repos.food.addFood(foodOn(today, { name: 'The day', meal: 'lunch', kcal: todayKcal, proteinG: 60, carbsG: 100, fatG: 30 }));
  }
  for (let i = 1; i <= lowDays; i++) {
    await repos.food.addFood(foodOn(today.addDays(-i), { name: 'Food', kcal: 1050, proteinG: 80, carbsG: 100, fatG: 30 }));
    await repos.dayMarks.setCompleteness(today.addDays(-i), 'complete');
  }
}

const ticked = new ScreeningAnswers({ weightLossMedication: true });

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('button', { name: 'Previous day' });
}

async function openCoach(): Promise<void> {
  renderApp(repos, today);
  await openTab('Coach');
  await screen.findByRole('heading', { name: 'Body' });
}

/** Whether `a` comes before `b` in the page. */
const before = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

it('ticked, the calorie card says what is logged so far and the aim, with protein above the calories', async () => {
  await seed({ screening: ticked, todayKcal: 900 });
  await openFood();
  const caption = await screen.findByText('so far, aiming for about 1,900 kcal');
  expect(screen.getAllByText('900').length).toBeGreaterThan(0);
  expect(before(screen.getByText(/^60 g · min 130 · target 160$/), caption)).toBe(true);
  expect(screen.queryByText(/left of/)).not.toBeInTheDocument();
});

it('ticked and over the target, the usual over wording is shown', async () => {
  await seed({ screening: ticked, todayKcal: 2400 });
  await openFood();
  expect(await screen.findByText(/^over 1,900/)).toBeInTheDocument();
  expect(screen.queryByText(/aiming for about/)).not.toBeInTheDocument();
});

it('not ticked, the calorie card says what is left, protein under the calories', async () => {
  await seed({ screening: new ScreeningAnswers({ weightAffectingMedication: true }), todayKcal: 900 });
  await openFood();
  const caption = await screen.findByText('left of 1,900');
  expect(screen.queryByText(/aiming for about/)).not.toBeInTheDocument();
  expect(before(caption, screen.getByText(/^60 g · min 130 · target 160$/))).toBe(true);
});

it('ticked, the dashboard card frames the target as a level to reach too', async () => {
  await seed({ screening: ticked, todayKcal: 900 });
  renderApp(repos, today);
  await dashboardLoaded();
  expect(await screen.findByText('so far, aiming for about 1,900 kcal')).toBeInTheDocument();
});

it('ticked, five low whole days are enough for the under-eating notice, with the prescriber lines', async () => {
  await seed({ screening: ticked, lowDays: 5 });
  renderApp(repos, today);
  await dashboardLoaded();
  expect(await screen.findByText('About your logged days')).toBeInTheDocument();
  expect(screen.getByText(/Low appetite on this medication is common\. If you often can’t reach the minimum, tell your prescriber\./)).toBeInTheDocument();
  expect(screen.getByText(/If you can’t keep food or fluids down, contact your prescriber promptly\./)).toBeInTheDocument();
});

it('not ticked, five low days raise no notice', async () => {
  await seed({ screening: new ScreeningAnswers({ weightAffectingMedication: true }), lowDays: 5 });
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.queryByText('About your logged days')).not.toBeInTheDocument();
});

it('ticked with an eating-disorder history, the prescriber lines come before the support line', async () => {
  await seed({ screening: new ScreeningAnswers({ weightLossMedication: true, eatingDisorderHistory: true }), lowDays: 7 });
  renderApp(repos, today);
  await dashboardLoaded();
  const text = (await screen.findByText(/Low appetite on this medication is common/)).textContent ?? '';
  expect(text.indexOf('contact your prescriber promptly')).toBeLessThan(text.indexOf('If eating has become a source of distress'));
  expect(text.toLowerCase()).not.toContain('fail');
});

it('ticked, a pace raised for safety adds the prescriber line, and never a dose', async () => {
  await seed({ screening: ticked, raisedForSafePace: true });
  await openCoach();
  await openHeadsUp();
  const notice = screen.getByText(/^You were losing weight faster than the app aims for/);
  expect(notice.textContent).toMatch(/Targets went up\. This pace is faster than the app would set, and faster loss can cost more muscle\. It is worth raising with your prescriber\.$/);
  expect(notice.textContent?.toLowerCase()).not.toContain('dose');
});

it('not ticked, the pace message is the usual one', async () => {
  await seed({ raisedForSafePace: true });
  await openCoach();
  await openHeadsUp();
  expect(screen.getByText(/^You were losing weight faster than the app aims for/).textContent).toMatch(/Targets went up\.$/);
  expect(screen.queryByText(/raising with your prescriber/)).not.toBeInTheDocument();
});

it('ticked with no training days, Coach says resistance training with enough protein is the best-supported way', async () => {
  await seed({ screening: ticked, trainingDaysPerWeek: 0 });
  await openCoach();
  expect(
    screen.getByText(
      'Resistance training, with enough protein, is the best-supported way to keep muscle while losing weight on this medication.',
    ),
  ).toBeInTheDocument();
});

it('ticked with training days set, or not ticked, there is no training note', async () => {
  await seed({ screening: ticked, trainingDaysPerWeek: 3 });
  const view = renderApp(repos, today);
  await openTab('Coach');
  await screen.findByRole('heading', { name: 'Body' });
  expect(screen.queryByText(/best-supported way to keep muscle/)).not.toBeInTheDocument();
  view.unmount();
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await seed({ trainingDaysPerWeek: 0 });
  await openCoach();
  expect(screen.queryByText(/best-supported way to keep muscle/)).not.toBeInTheDocument();
});
