import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Seventy days in, fifty eaten at `intakeKcal` against a 2,100 kcal target
 * and weighed flat (MM-140): the coach sees a stall. Two of the days are
 * marked partial, so the metabolism estimate says it left them out. Far
 * below the target, the logs and the scale disagree and the estimate is
 * held at a safe limit.
 */
export const stalledScenario = (intakeKcal = 2100): StoryScenario => async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-70), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-60), { kcal: 2100, proteinG: 160, proteinMinimumG: 130, carbsG: 220, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
  );
  for (let i = 0; i <= 50; i++) {
    const day = today.addDays(-i);
    await repos.weights.saveWeight(day, 82);
    if (i === 0) continue;
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: day, meal: 'dinner', name: 'Demo day of food', kcal: intakeKcal, proteinG: 150, carbsG: 220, fatG: 70, source: 'weighed' }),
    );
    await repos.dayMarks.setCompleteness(day, i === 4 || i === 11 ? 'partial' : 'complete');
  }
};
