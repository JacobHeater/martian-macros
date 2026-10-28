import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { RecompMeasure } from '../../src/engine/RecompMeasure';
import { RecompReview } from '../../src/engine/RecompReview';
import type { RecompVerdict } from '../../src/engine/RecompVerdict';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { recompReviewText } from '../../src/format/recompReviewText';
import { first } from '../support/first';
import { openCoach as openCoachTab } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { topLayer } from '../support/topLayer';
import { workoutOn } from '../support/workoutOn';

/** MM-133: the recomp review on the Coach screen, and what it says. Carried over from recomp_review_test.dart. */
const today = CalendarDate.of(2026, 10, 5);

const review = (
  verdict: RecompVerdict | undefined,
  { week = 12, nextGoal, missing = [] }: { week?: number; nextGoal?: GoalMode; missing?: readonly RecompMeasure[] } = {},
) =>
  new RecompReview({
    week,
    periodDays: week === 8 ? 56 : 84,
    verdict,
    missing,
    waistMeasurements: 2,
    nextGoal,
  });

const every = [
  review('working'),
  review('slowCut', { nextGoal: 'fatLoss' }),
  review('slowCut'),
  review('probablyWorking'),
  review('tooEarly', { week: 8 }),
  review('notWorking'),
  review('notWorking', { nextGoal: 'fatLoss' }),
  review('notWorking', { nextGoal: 'leanGain' }),
  review('notWorking', { nextGoal: 'maintenance' }),
  review(undefined, { missing: RecompMeasure.values }),
];

describe('what the coach says', () => {
  it('working: carry on', () => {
    expect(recompReviewText(review('working'))).toContain('Carry on.');
  });

  it('a slow cut is called what it is, and offers the gentle pace', () => {
    const text = recompReviewText(review('slowCut', { nextGoal: 'fatLoss' }));
    expect(text).toContain('You are losing weight, which is fine.');
    expect(text).toContain('Fat loss at the Gentle pace');
    expect(recompReviewText(review('slowCut'))).not.toContain('Fat loss at');
  });

  it('too early says when the next review is', () => {
    expect(recompReviewText(review('tooEarly', { week: 8 }))).toContain('The next review is at twelve weeks.');
  });

  it('not working comes with a next step and its reason', () => {
    expect(recompReviewText(review('notWorking', { nextGoal: 'fatLoss' }))).toContain(
      'At your body fat a fat loss phase',
    );
    expect(recompReviewText(review('notWorking', { nextGoal: 'leanGain' }))).toContain('building needs a surplus');
    expect(recompReviewText(review('notWorking'))).toContain('the training is the place to look first');
  });

  it('missing data says exactly what is missing', () => {
    const text = recompReviewText(review(undefined, { missing: ['waist'] }));
    expect(text.startsWith('No verdict yet.')).toBe(true);
    expect(text).toContain('at least four waist measurements');
    expect(text).toContain('(there are 2)');
    expect(text).not.toContain('lifts');
  });

  it('no verdict claims a measurement, blames or gives orders', () => {
    for (const r of every) {
      const text = recompReviewText(r).toLowerCase();
      for (const word of ['gained muscle', 'lost fat', 'fail', 'should', 'must', 'bad', 'cheat']) {
        expect(text, `${word} in "${text}"`).not.toContain(word);
      }
    }
  });
});

describe('on the Coach screen', () => {
  let repos: InMemoryRepositories;

  async function setUpUser(goal: GoalMode): Promise<void> {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: today.addDays(-100), goalMode: goal, healthCheckConfirmedOn: today }).copyWith({
        unitSystem: 'metric',
      }),
    );
    for (let d = 100; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 82 + (d % 2 === 0 ? 0.2 : -0.2));
    for (let d = 84; d >= 0; d -= 7) {
      await repos.targets.saveTargets(
        targetsFrom(today.addDays(-d), {
          mode: goal,
          tdeeKcal: 2500,
          tdeeSigmaKcal: 150,
          tdeeStatus: 'updated',
          proteinG: 160,
          weeklyRateFraction: -0.001,
        }),
      );
    }
  }

  async function measuredWeekly(): Promise<void> {
    for (let d = 84; d >= 0; d -= 7) await repos.waist.saveWaist(today.addDays(-d), 89 + (3 * d) / 84);
  }

  async function trainedWeekly(): Promise<void> {
    for (let week = 12; week >= 0; week--) {
      await repos.workouts.saveWorkout(
        workoutOn(today.addDays(-1 - week * 7), [
          ['back-squat', 6, 100.0 + (12 - week)],
          ['barbell-row', 6, 60.0 + (12 - week)],
        ]),
      );
    }
  }

  async function openCoach(): Promise<void> {
    renderApp(repos, today);
    await openCoachTab();
    await screen.findByRole('heading', { name: 'Body' });
  }

  const card = () => screen.queryByRole('heading', { name: /^Recomp review, week/ })?.closest('.mm-section') ?? null;

  it('twelve weeks, waist down and lifts up: working, with the facts, and the goal unchanged', async () => {
    await setUpUser('recomp');
    await measuredWeekly();
    await trainedWeekly();
    await openCoach();

    expect(screen.getByRole('heading', { name: 'Recomp review, week 12' })).toBeInTheDocument();
    const shown = within(card() as HTMLElement);
    expect(shown.getByText(/^It is working\./)).toBeInTheDocument();
    expect(shown.getByText('84 days')).toBeInTheDocument();
    // Smoothed at each end (MM-155), so a little under the 3 cm entered.
    expect(shown.getByText('Down 2.5 cm')).toBeInTheDocument();
    expect(shown.getByText(/^Up: /)).toBeInTheDocument();
    expect(shown.getByText(/not a measurement of it/)).toBeInTheDocument();
    expect((await first(repos.setup.watchSetup()))?.goalMode).toBe('recomp');
  });

  it('without waist measurements it gives no verdict and says what is missing', async () => {
    await setUpUser('recomp');
    await trainedWeekly();
    await openCoach();

    expect(card()).toHaveTextContent(/No verdict yet\./);
    expect(card()).toHaveTextContent('(there are 0)');
  });

  it('the monthly report of the month it fell due in holds it too', async () => {
    await setUpUser('recomp');
    await measuredWeekly();
    await trainedWeekly();
    await openCoach();
    // Coaching began 100 days ago and recomp 84: the third report covers
    // days 40 to 67 of it, and the week 8 review fell due on day 56.
    // Folded to one line (MM-676): opened here unless the tab's opener already did.
    const reportsHeader = screen.getByRole('button', { name: /^Monthly reports/ });
    if (reportsHeader.getAttribute('aria-expanded') === 'false') await userEvent.click(reportsHeader);
    const reports = screen.getByRole('heading', { name: 'Monthly reports' }).closest('.mm-section') as HTMLElement;
    const rows = within(reports).getAllByRole('button', { name: /^[A-Z][a-z]{2} \d+ – / });
    expect(rows).toHaveLength(3);
    await userEvent.click(rows[0] as HTMLElement);
    expect(await within(topLayer()).findByRole('heading', { name: 'Recomp review, week 8' })).toBeInTheDocument();
  });

  it('there is no review on another goal', async () => {
    await setUpUser('maintenance');
    await measuredWeekly();
    await trainedWeekly();
    await openCoach();

    expect(card()).toBeNull();
  });
});
