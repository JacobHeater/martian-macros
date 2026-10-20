import type { BreakFlag } from '../../engine/breakInForce';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * A diet break in its first week (MM-135): the one the person chose
 * (`requestedBreak`) or the one the app planned at twenty weeks
 * (`dietBreak`). Targets at maintenance, the next check-in two weeks out.
 */
export const onBreakScenario =
  (flag: BreakFlag): StoryScenario =>
  async (repos, today) => {
    const weeks = flag === 'dietBreak' ? 20 : 13;
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: today.addDays(-7 * weeks - 20), healthCheckConfirmedOn: today.addDays(-30) }),
    );
    for (let i = 0; i < 14; i++) await repos.weights.saveWeight(today.addDays(-i), 80 + Math.min(i, 3) * 0.1);
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-7 * weeks - 3), { kcal: 2000, proteinG: 160, carbsG: 200, tdeeKcal: 2600, tdeeSigmaKcal: 300 }),
    );
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-3), {
        kcal: 2600,
        proteinG: 150,
        carbsG: 320,
        weeklyRateFraction: 0,
        flags: [flag],
        tdeeKcal: 2600,
        tdeeSigmaKcal: 250,
        tdeeStatus: 'updated',
      }),
    );
  };
