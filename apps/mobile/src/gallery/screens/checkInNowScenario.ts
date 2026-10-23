import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Three weeks of logged food, every day to today, and of weigh-ins, the
 * last `lastWeighInDaysAgo` days ago, and targets three days old well under
 * what today's figures give: "Check in now" on the Coach (MM-559), on when
 * the last weigh-in is from the last week and off, with its notice, when it
 * is older. The food keeps the person present, so an old weigh-in is not a
 * gap the welcome-back screen answers (MM-147, MM-573).
 */
export const checkInNowScenario =
  (lastWeighInDaysAgo: number): StoryScenario =>
  async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-21), healthCheckConfirmedOn: today }));
    for (let i = 0; i <= 21; i++) {
      const day = today.addDays(-i);
      if (i >= lastWeighInDaysAgo) await repos.weights.saveWeight(day, 80 + i * 0.05);
      await repos.food.addFood(
        new FoodEntry({ id: 0, date: day, meal: 'dinner', name: 'Demo day of food', kcal: 2300, proteinG: 150, carbsG: 250, fatG: 75, source: 'weighed' }),
      );
      if (i > 0) await repos.dayMarks.setCompleteness(day, 'complete');
    }
    await repos.targets.saveTargets(storyTargets(today.addDays(-3), { kcal: 1800, proteinG: 150, carbsG: 180 }));
  };
