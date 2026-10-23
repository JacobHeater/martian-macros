import { entryOfMealItem } from '../../domain/food/meal/entryOfMealItem';
import { parseMealAnalysis } from '../../domain/food/meal/parseMealAnalysis';
import { DemoSeed } from '../../fixtures/DemoSeed';
import type { StoryScenario } from './StoryScenario';
import { cleanMealAnswer } from './storyMealAnswers';

/** The meal's key in the stories (MM-587), so a story can open it. */
export const storyMealKey = 'story-meal';

/** The demo, with "Chicken and rice" analysed and logged to today's dinner at 7 pm (MM-586, MM-587). */
export const loggedMealScenario: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  const loggedMeal = { key: storyMealKey, name: reading.draft.name };
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date: today, meal: 'dinner', eatenAt: 19 * 60, loggedMeal }));
  }
};
