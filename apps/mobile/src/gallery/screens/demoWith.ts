import type { DetailLevel } from '../../domain/food/detail/DetailLevel';
import type { MacroPicture } from '../../domain/MacroPicture';
import { ScreeningAnswers } from '../../domain/ScreeningAnswers';
import type { UnitSystem } from '../../domain/UnitSystem';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/**
 * The demo's ten weeks, with the person's choices for one story (MM-305):
 * the detail level, the picture on the nutrition card, the goals switched
 * on, the units, and whether she is pregnant.
 */
export function demoWith({
  detail,
  picture,
  sodiumLimitMg,
  waterGoalMl,
  units,
  pregnant = false,
}: {
  detail?: DetailLevel;
  picture?: MacroPicture;
  sodiumLimitMg?: number;
  waterGoalMl?: number;
  units?: UnitSystem;
  pregnant?: boolean;
}): StoryScenario {
  return async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    if (pregnant) {
      await repos.setup.saveSetup(
        typicalSetup({
          sex: 'female',
          screening: new ScreeningAnswers({ pregnant: true }),
          onboardedOn: today.addDays(-DemoSeed.historyDays),
          healthCheckConfirmedOn: today,
        }),
      );
    }
    if (units !== undefined) {
      const setup = typicalSetup({ onboardedOn: today.addDays(-DemoSeed.historyDays), healthCheckConfirmedOn: today });
      await repos.setup.saveSetup(setup.copyWith({ unitSystem: units }));
    }
    if (detail !== undefined) await repos.preferences.saveDetailLevel(detail);
    if (picture !== undefined) await repos.preferences.saveMacroPicture(picture);
    if (sodiumLimitMg !== undefined) await repos.preferences.saveSodiumLimit(sodiumLimitMg);
    if (waterGoalMl !== undefined) await repos.preferences.saveWaterGoal(waterGoalMl);
  };
}
