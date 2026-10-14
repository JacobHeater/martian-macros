import { CalendarDate } from '../../domain/CalendarDate';
import type { DetailLevel } from '../../domain/food/detail/DetailLevel';
import type { MacroPicture } from '../../domain/MacroPicture';
import { Profile } from '../../domain/Profile';
import { ScreeningAnswers } from '../../domain/ScreeningAnswers';
import type { UnitSystem } from '../../domain/UnitSystem';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/**
 * The demo's ten weeks, with the person's choices for one story (MM-305):
 * the detail level, the picture on the nutrition card, the goals switched
 * on, the units, her health check and age, and anything more `then` adds.
 */
export function demoWith({
  detail,
  picture,
  sodiumLimitMg,
  waterGoalMl,
  units,
  pregnant = false,
  screening,
  birthYear,
  then,
}: {
  detail?: DetailLevel;
  picture?: MacroPicture;
  sodiumLimitMg?: number;
  waterGoalMl?: number;
  units?: UnitSystem;
  pregnant?: boolean;
  /** Health-check answers, for a woman (pregnancy) or anyone. */
  screening?: ConstructorParameters<typeof ScreeningAnswers>[0];
  birthYear?: number;
  then?: StoryScenario;
}): StoryScenario {
  return async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    const answers = pregnant ? { pregnant: true, ...screening } : screening;
    if (answers !== undefined || units !== undefined || birthYear !== undefined) {
      const sex = pregnant ? 'female' : 'male';
      const setup = typicalSetup({
        sex,
        screening: new ScreeningAnswers(answers ?? {}),
        onboardedOn: today.addDays(-DemoSeed.historyDays),
        healthCheckConfirmedOn: today,
      });
      await repos.setup.saveSetup(
        setup.copyWith({
          unitSystem: units ?? setup.unitSystem,
          profile:
            birthYear === undefined
              ? setup.profile
              : new Profile({ sex, birthDate: CalendarDate.of(birthYear, 1, 1), heightCm: 180 }),
        }),
      );
    }
    if (detail !== undefined) await repos.preferences.saveDetailLevel(detail);
    if (picture !== undefined) await repos.preferences.saveMacroPicture(picture);
    if (sodiumLimitMg !== undefined) await repos.preferences.saveSodiumLimit(sodiumLimitMg, today.addDays(-30));
    if (waterGoalMl !== undefined) await repos.preferences.saveWaterGoal(waterGoalMl);
    if (then !== undefined) await then(repos, today);
  };
}
