import { RecoveryCheckIn } from '../../domain/RecoveryCheckIn';
import { SleepNight } from '../../domain/SleepNight';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * On a cut, hunger and energy fine at the check-ins, and a fortnight of
 * nights typed at five and a half hours (MM-252): the coach offers the
 * gentler pace on short sleep alone.
 */
export const shortSleepScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-3), { kcal: 2000, proteinG: 160, carbsG: 200, tdeeKcal: 2600, tdeeSigmaKcal: 300 }),
  );
  for (let week = 0; week < 2; week++) {
    await repos.recovery.saveRecoveryCheckIn(
      new RecoveryCheckIn({ date: today.addDays(-1 - 7 * week), hunger: 4, energy: 4, sleep: 2, training: 4, mood: 4 }),
    );
  }
  for (let night = 0; night < 14; night++) {
    await repos.sleep.saveSleepNight(new SleepNight({ date: today.addDays(-night), minutesAsleep: 320 + (night % 3) * 10, source: 'typed' }));
  }
};
