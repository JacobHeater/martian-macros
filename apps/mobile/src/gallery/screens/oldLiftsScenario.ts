import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyWorkout } from './storyWorkout';

/**
 * A lifter who stopped four months ago (MM-77, MM-78): squats of five that
 * qualify for a strength estimate but are past the 90 days the trend looks
 * at, and bench presses of 25 that never qualify. This week, a set of an
 * exercise of their own that has since been deleted, so the weekly volume
 * cannot map its muscles.
 */
export const oldLiftsScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 84);
  for (const ago of [130, 127, 124, 121]) {
    await repos.workouts.saveWorkout(
      storyWorkout(today.addDays(-ago), [
        ['back-squat', 5, 100],
        ['barbell-bench-press', 25, 40],
      ]),
    );
  }
  await repos.workouts.saveWorkout(storyWorkout(today.addDays(-2), [['custom-deleted-row', 10, 30]]));
};
