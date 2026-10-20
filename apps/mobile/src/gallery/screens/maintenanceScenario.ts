import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * A twelve-week cut that ended `daysAgo` days ago, maintenance since
 * (MM-130). Weighed daily: flat through the cut's end, then up `reboundKg`
 * over the first ten days as the water came back, then `driftKg` more from
 * day 20 on, so a story can show the first fortnight, a settled anchor, or
 * a drift the coach asks about.
 */
export const maintenanceScenario =
  ({ daysAgo, reboundKg = 1, driftKg = 0 }: { daysAgo: number; reboundKg?: number; driftKg?: number }): StoryScenario =>
  async (repos, today) => {
    const cutStart = today.addDays(-daysAgo - 84);
    const maintenanceStart = today.addDays(-daysAgo);
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: cutStart.addDays(-14), healthCheckConfirmedOn: today, goalMode: 'maintenance' }),
    );
    await repos.targets.saveTargets(
      storyTargets(cutStart, { kcal: 2000, proteinG: 160, proteinMinimumG: 130, carbsG: 200, tdeeKcal: 2700, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
    );
    await repos.targets.saveTargets(
      storyTargets(maintenanceStart, {
        kcal: 2650,
        proteinG: 150,
        proteinMinimumG: 125,
        carbsG: 320,
        mode: 'maintenance',
        weeklyRateFraction: 0,
        tdeeKcal: 2650,
        tdeeSigmaKcal: 150,
        tdeeStatus: 'updated',
      }),
    );
    for (let i = 0; i <= daysAgo + 40; i++) {
      const day = today.addDays(-i);
      const sinceStart = maintenanceStart.daysUntil(day);
      let kg = 80;
      if (sinceStart > 0) kg += reboundKg * Math.min(1, sinceStart / 10);
      if (sinceStart > 20) kg += driftKg * Math.min(1, (sinceStart - 20) / 10);
      await repos.weights.saveWeight(day, kg);
      if (i === 0) continue;
      const kcal = sinceStart > 0 ? 2650 : 2000;
      await repos.food.addFood(
        new FoodEntry({ id: 0, date: day, meal: 'dinner', name: 'Demo day of food', kcal, proteinG: 150, carbsG: kcal > 2200 ? 320 : 200, fatG: 75, source: 'weighed' }),
      );
      await repos.dayMarks.setCompleteness(day, 'complete');
    }
  };
