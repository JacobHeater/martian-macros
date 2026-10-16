import { ExplanationLine } from '../../engine/ExplanationLine';
import { TargetsExplanation } from '../../engine/TargetsExplanation';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';
import { storyWorkout } from './storyWorkout';

/**
 * Twelve weeks of recomposition (MM-133): weighed flat, the waist down a
 * little each week, two lifts up a little each week, and the calorie target
 * eased 10 kcal at each weekly check-in, each with its reason. The week 12
 * review is due, and the monthly reports carry the earlier reviews and the
 * changes.
 */
export const recompScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-100), goalMode: 'recomp', healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  for (let d = 100; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 82 + (d % 2 === 0 ? 0.2 : -0.2));
  for (let d = 84; d >= 0; d -= 7) {
    const kcal = 2400 - ((84 - d) / 7) * 10;
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-d), {
        mode: 'recomp',
        kcal,
        tdeeKcal: 2500,
        tdeeSigmaKcal: 150,
        tdeeStatus: 'updated',
        proteinG: 160,
        weeklyRateFraction: -0.001,
        explanation:
          d === 84
            ? undefined
            : new TargetsExplanation({
                lines: [new ExplanationLine('paceAndWeight', -10)],
                newKcal: kcal,
                previousKcal: kcal + 10,
                estimateStatus: 'updated',
                usableIntakeDays: 20,
                weighIns: 28,
              }),
      }),
    );
    await repos.waist.saveWaist(today.addDays(-d), 89 + (3 * d) / 84);
  }
  for (let week = 12; week >= 0; week--) {
    await repos.workouts.saveWorkout(
      storyWorkout(today.addDays(-1 - week * 7), [
        ['back-squat', 6, 100 + (12 - week)],
        ['barbell-row', 6, 60 + (12 - week)],
      ]),
    );
  }
};
