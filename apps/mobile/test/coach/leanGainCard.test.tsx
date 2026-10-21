import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-129: the lean-gain guardrails on the Coach screen. */
const today = CalendarDate.of(2026, 10, 5);

describe('the lean-gain card', () => {
  let repos: InMemoryRepositories;

  /** Ten weeks on `goal`, weighed daily from 80 kg to 83 kg; estimated body fat from BMI is about 23%. */
  async function setUpUser(goal: GoalMode, screening = new ScreeningAnswers()): Promise<void> {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: today.addDays(-90), goalMode: goal, screening, healthCheckConfirmedOn: today }).copyWith({
        unitSystem: 'metric',
      }),
    );
    for (let d = 80; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), d >= 70 ? 80 : 80 + (3 * (70 - d)) / 70);
    for (let d = 70; d >= 0; d -= 7) {
      await repos.targets.saveTargets(
        targetsFrom(today.addDays(-d), {
          mode: goal,
          kcal: 2900,
          tdeeKcal: 2650,
          tdeeSigmaKcal: 150,
          tdeeStatus: 'updated',
          weeklyRateFraction: goal === 'leanGain' ? 0.0035 : 0,
        }),
      );
    }
  }

  async function openCoach(): Promise<void> {
    renderApp(repos, today);
    await openTab('Coach');
    await screen.findByRole('heading', { name: 'Body' });
  }

  const card = () => screen.queryByRole('heading', { name: /^Lean gain, week/ })?.closest('.mm-section') ?? null;

  it('body fat past 20%: ending the gain is recommended with its reason, a goal is offered, and the goal stays', async () => {
    await setUpUser('leanGain');
    await openCoach();

    const shown = within(card() as HTMLElement);
    expect(shown.getByText(/The coach recommends ending the gain now/)).toBeInTheDocument();
    expect(shown.getByText(/Your goal stays as it is until you change it\./)).toBeInTheDocument();
    await userEvent.click(shown.getByRole('button', { name: 'Choose a goal' }));
    expect(await screen.findByRole('dialog', { name: 'Choose a goal' })).toBeInTheDocument();
    expect((await first(repos.setup.watchSetup()))?.goalMode).toBe('leanGain');
  });

  it('with an eating-disorder history no body-fat line is said', async () => {
    await setUpUser('leanGain', new ScreeningAnswers({ eatingDisorderHistory: true }));
    await openCoach();

    expect(card()).toBeNull();
  });

  it('there is no card on another goal', async () => {
    await setUpUser('maintenance');
    await openCoach();

    expect(card()).toBeNull();
  });
});
