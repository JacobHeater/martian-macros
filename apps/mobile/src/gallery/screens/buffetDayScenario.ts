import type { CalendarDate } from '../../domain/CalendarDate';
import { FoodEntry } from '../../domain/FoodEntry';
import type { Meal } from '../../domain/Meal';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { buffetDayFoods } from './buffetDayFoods';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/** A food as `buffetDayFoods` writes it: name, kcal, protein, carbohydrate, fat, sodium, fiber. */
type Row = readonly [name: string, kcal: number, proteinG: number, carbsG: number, fatG: number, sodiumMg: number, fiberG: number];

/**
 * The owner's buffet day (MM-617's first scenario) for the Coach tab: on a
 * cut at 2,175 kcal, protein 187 g with a 149 g minimum, fat 60 g and a
 * 1,800 mg sodium limit, at Full detail so fiber and sodium are read, the
 * day's foods as `buffetDayFoods` has them (the analysis's fixture is the
 * same day): the biscuit meal at breakfast, the 13-food Chinese buffet and
 * a Diet Pepsi at lunch, cookie butter as a snack, no dinner. A week of
 * weigh-ins before it. 1d reads it: 1,054 kcal over, the buffet did it.
 */
export const buffetDayScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(storyTargets(today.addDays(-30), { ...buffetDayFoods.targets, mode: 'fatLoss' }));
  await repos.preferences.saveDetailLevel('full');
  await repos.preferences.saveSodiumLimit(buffetDayFoods.sodiumLimitMg, today.addDays(-30));
  for (let i = 0; i <= 14; i++) await repos.weights.saveWeight(today.addDays(-i), 96 + i * 0.05);
  const add = (date: CalendarDate, meal: Meal, [name, kcal, proteinG, carbsG, fatG, sodiumMg, fiberG]: Row, loggedMeal?: { key: string; name: string }) =>
    repos.food.addFood(
      new FoodEntry({ id: 0, date, meal, name, kcal, proteinG, carbsG, fatG, sodiumMg, fiberG, source: 'labelServing', loggedMeal }),
    );
  const { breakfastMeal, buffetMeal } = buffetDayFoods;
  for (const row of buffetDayFoods.breakfast) await add(today, 'breakfast', row, { ...breakfastMeal });
  await add(today, 'lunch', buffetDayFoods.drink);
  for (const row of buffetDayFoods.buffet) await add(today, 'lunch', row, { ...buffetMeal });
  await add(today, 'snack', buffetDayFoods.snack);
};
