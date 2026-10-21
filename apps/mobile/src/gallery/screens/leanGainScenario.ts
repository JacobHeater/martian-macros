import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';
import { storyWorkout } from './storyWorkout';

/**
 * Ten weeks of lean gain (MM-129): trend weight up 3 kg, the waist up 4 cm
 * between its smoothed ends over weekly entries, two lifts trained weekly at the same loads. With
 * `bodyFatPercent` under 20 the gain reads fat-heavy with strength flat;
 * without it the estimate from body mass index, and the upper end of its
 * range, is above 20%, so the coach recommends ending the gain first.
 */
export const leanGainScenario =
  ({ bodyFatPercent }: { bodyFatPercent?: number } = {}): StoryScenario =>
  async (repos, today) => {
    const setup = typicalSetup({ onboardedOn: today.addDays(-90), goalMode: 'leanGain', healthCheckConfirmedOn: today });
    await repos.setup.saveSetup(bodyFatPercent === undefined ? setup : setup.copyWith({ bodyFatPercent }));
    for (let d = 80; d >= 0; d--) {
      await repos.weights.saveWeight(today.addDays(-d), (d >= 70 ? 80 : 80 + (3 * (70 - d)) / 70) + (d % 2 === 0 ? 0.2 : -0.2));
    }
    for (let d = 70; d >= 0; d -= 7) {
      await repos.targets.saveTargets(
        storyTargets(today.addDays(-d), {
          mode: 'leanGain',
          kcal: 2900,
          tdeeKcal: 2650,
          tdeeSigmaKcal: 150,
          tdeeStatus: 'updated',
          proteinG: 150,
          weeklyRateFraction: 0.0035,
        }),
      );
      // Flat for the first three entries and the last three, so each smoothed end is a plain 86 and 90.
      await repos.waist.saveWaist(today.addDays(-d), d >= 56 ? 86 : d <= 14 ? 90 : 86 + (4 * (56 - d)) / 42);
    }
    for (let week = 10; week >= 0; week--) {
      await repos.workouts.saveWorkout(
        storyWorkout(today.addDays(-1 - week * 7), [
          ['back-squat', 6, 100],
          ['barbell-row', 6, 60],
        ]),
      );
    }
  };
