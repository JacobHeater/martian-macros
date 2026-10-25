import type { CalendarDate } from '../../domain/CalendarDate';
import { FoodEntry } from '../../domain/FoodEntry';
import type { Meal } from '../../domain/Meal';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * A season of food for the Coach tab's analysis (MM-610): on a cut at 2,400 kcal, protein 170 g with a 140 g
 * minimum, the 95 days through yesterday logged in full with the same three meals, so every span the switcher has
 * (1d, 7d, 2w, 1m and 3m) is offered. Today has breakfast so far.
 */
export const analysisSeasonScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-100), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-100), { kcal: 2400, proteinG: 170, proteinMinimumG: 140, fatG: 70, carbsG: 250, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
  );
  for (let i = 0; i <= 28; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.05);
  const food = (date: CalendarDate, meal: Meal, name: string, kcal: number, proteinG: number, fatG: number) =>
    repos.food.addFood(
      new FoodEntry({
        id: 0,
        date,
        meal,
        name,
        kcal,
        proteinG,
        carbsG: Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4),
        fatG,
        source: 'weighed',
      }),
    );
  for (let i = 1; i <= 95; i++) {
    const date = today.addDays(-i);
    await food(date, 'breakfast', 'Oats and whey', 600, 45, 14);
    await food(date, 'lunch', 'Chicken and rice', 800, 60, 22);
    await food(date, 'dinner', 'Salmon and potatoes', 950, 60, 32);
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  await food(today, 'breakfast', 'Oats and whey', 600, 45, 14);
};
