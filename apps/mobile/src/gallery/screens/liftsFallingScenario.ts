import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';
import { storyWorkout } from './storyWorkout';

/**
 * Nine weeks into a cut, the squat and the row falling over three weeks, no
 * check-in answered (MM-117): the coach offers to ease the deficit for the lifts.
 */
export const liftsFallingScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-63), { kcal: 2000, proteinG: 160, carbsG: 200, tdeeKcal: 2600, tdeeSigmaKcal: 300 }),
  );
  for (const [daysAgo, kg] of [
    [28, 100],
    [21, 100],
    [14, 96],
    [7, 92],
    [1, 88],
  ] as const) {
    await repos.workouts.saveWorkout(storyWorkout(today.addDays(-daysAgo), [['back-squat', 5, kg], ['barbell-row', 5, kg * 0.6]]));
  }
};
