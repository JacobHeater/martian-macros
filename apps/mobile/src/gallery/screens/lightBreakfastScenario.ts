import { FoodEntry } from '../../domain/FoodEntry';
import { CardioSession } from '../../domain/training/CardioSession';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

const minuteMs = 60 * 1000;

/**
 * The owner's morning of 2026-10-30 (MM-711): a 2,178 kcal and 187 g day,
 * a breakfast of oatmeal, maple syrup and butter, 243 kcal for 5 g, and
 * nothing else logged yet; six days before it eaten on target. A watch
 * worn, one short walk this week and about 5,900 steps a day, no lift
 * logged. The sheet and the brief have nothing to fix in the breakfast
 * and say so; the training line holds the person to the lift.
 */
export const lightBreakfastScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(storyTargets(today.addDays(-28), { kcal: 2178, proteinG: 187, proteinMinimumG: 150, tdeeKcal: 2700, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }));
  for (let i = 0; i <= 28; i++) await repos.weights.saveWeight(today.addDays(-i), 90 - (28 - i) * 0.05);
  const add = (daysAgo: number, meal: FoodEntry['meal'], name: string, kcal: number, proteinG: number, fatG: number) =>
    repos.food.addFood(
      new FoodEntry({ id: 0, date: today.addDays(-daysAgo), meal, name, kcal, proteinG, carbsG: Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4), fatG, source: 'labelServing' }),
    );
  for (let daysAgo = 1; daysAgo <= 6; daysAgo++) {
    await add(daysAgo, 'breakfast', 'Greek yogurt with oats', 500, 40, 12);
    await add(daysAgo, 'lunch', 'Chicken rice bowl', 800, 70, 20);
    await add(daysAgo, 'dinner', 'Salmon with potatoes', 850, 75, 35);
    await repos.dayMarks.setCompleteness(today.addDays(-daysAgo), 'complete');
  }
  await add(0, 'breakfast', 'Banana nut with prebiotic fiber superfood oatmeal', 160, 5, 4);
  await add(0, 'breakfast', 'Organic dark color maple syrup, grade A', 50, 0, 0);
  await add(0, 'breakfast', 'Unsalted sweet cream butter', 33, 0, 4);
  const walk = today.addDays(-2);
  const start = new Date(walk.year, walk.month - 1, walk.day, 7, 5);
  await repos.cardioSessions.saveCardioSessions([
    new CardioSession({ platformId: 'walk-2', sourceName: 'Watch', activity: 'walking', start, end: new Date(start.getTime() + 38 * minuteMs) }),
  ]);
  await repos.dailySteps.saveDailySteps(Array.from({ length: 7 }, (_, daysAgo) => ({ date: today.addDays(-daysAgo), steps: 5881 })));
};
