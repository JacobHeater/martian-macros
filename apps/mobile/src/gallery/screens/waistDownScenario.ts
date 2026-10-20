import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Seventy days in at maintenance, weighed flat and logged whole, the tape
 * down two centimetres over the last fortnight (MM-141): the waist against
 * the scale, in a goal that is not recomp.
 */
export const waistDownScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-70), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-60), {
      kcal: 2400,
      proteinG: 160,
      proteinMinimumG: 130,
      carbsG: 260,
      mode: 'maintenance',
      weeklyRateFraction: 0,
      tdeeSigmaKcal: 150,
      tdeeStatus: 'updated',
    }),
  );
  for (let i = 0; i <= 28; i++) {
    const day = today.addDays(-i);
    await repos.weights.saveWeight(day, 82);
    if (i === 0) continue;
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: day, meal: 'dinner', name: 'Demo day of food', kcal: 2400, proteinG: 150, carbsG: 260, fatG: 75, source: 'weighed' }),
    );
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
  for (const [daysAgo, cm] of [
    [41, 93.0],
    [28, 92.6],
    [21, 92.2],
    [14, 91.0],
    [7, 90.4],
    [1, 90.0],
  ] as const) {
    await repos.waist.saveWaist(today.addDays(-daysAgo), cm);
  }
};
