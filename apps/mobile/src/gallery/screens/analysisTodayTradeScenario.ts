import type { CalendarDate } from '../../domain/CalendarDate';
import { FoodEntry } from '../../domain/FoodEntry';
import type { Meal } from '../../domain/Meal';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * MM-612's lunch, with a trade on 1d (MM-607): on a cut at 2,400 kcal and protein 170 g, cottage cheese with fruit
 * logged at lunch on two days of the last week, and today's lunch so far cheese and crackers, 600 kcal with 14 g
 * protein. Today's protein per 100 kcal is under what the targets need, and the trade names both foods. The cottage
 * cheese is a little more energy than the crackers: on 1d, a lower-calorie Y is checked against the calorie floor with
 * the day only part logged, so it would not be offered.
 */
export const analysisTodayTradeScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-10), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-10), { kcal: 2400, proteinG: 170, proteinMinimumG: 140, fatG: 70, carbsG: 250 }),
  );
  for (let i = 0; i <= 10; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.05);
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
  await food(today.addDays(-5), 'lunch', 'Cottage cheese with fruit', 620, 45, 12);
  await food(today.addDays(-2), 'lunch', 'Cottage cheese with fruit', 620, 45, 12);
  await food(today, 'lunch', 'Cheese and crackers', 600, 14, 40);
};
