import { RecoveryCheckIn } from '../../domain/RecoveryCheckIn';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/** On a cut, two hard weeks answered in the recovery check-in (MM-117): the coach offers to ease the deficit. */
export const reliefScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-3), { kcal: 2000, proteinG: 160, carbsG: 200, tdeeKcal: 2600, tdeeSigmaKcal: 300 }),
  );
  for (let week = 0; week < 2; week++) {
    await repos.recovery.saveRecoveryCheckIn(
      new RecoveryCheckIn({ date: today.addDays(-1 - 7 * week), hunger: 1, energy: 2, sleep: 1, training: 4, mood: 3, sleepHours: 5.5 }),
    );
  }
};
