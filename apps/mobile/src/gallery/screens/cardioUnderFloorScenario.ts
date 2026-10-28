import { FoodEntry } from '../../domain/FoodEntry';
import { CardioSession } from '../../domain/training/CardioSession';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

const minuteMs = 60 * 1000;

/**
 * Ten weeks into a cut with a watch worn (MM-678): the last week's cardio
 * 96 minutes against the 150 floor and about 6,100 steps a day against
 * 8,000, so the coach's two cardio fixes show in "What your data says";
 * the four weeks before over both floors. The last two weeks eaten on
 * target and logged in full, so the food side has nothing to add.
 */
export const cardioUnderFloorScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-100), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(storyTargets(today.addDays(-70), { kcal: 2200, proteinG: 170, proteinMinimumG: 140, tdeeKcal: 2700, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }));
  for (let i = 0; i <= 35; i++) await repos.weights.saveWeight(today.addDays(-i), 84 - (35 - i) * 0.04);
  const session = (daysAgo: number, activity: CardioSession['activity'], minutes: number) => {
    const date = today.addDays(-daysAgo);
    const start = new Date(date.year, date.month - 1, date.day, 7, 5);
    return new CardioSession({ platformId: `${activity}-${daysAgo}`, sourceName: 'Watch', activity, start, end: new Date(start.getTime() + minutes * minuteMs) });
  };
  await repos.cardioSessions.saveCardioSessions([
    session(2, 'walking', 36),
    session(4, 'running', 30),
    session(6, 'walking', 30),
    ...[1, 2, 3, 4].flatMap((week) => [session(7 * week + 1, 'walking', 80), session(7 * week + 4, 'cycling', 80)]),
  ]);
  for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
    const date = today.addDays(-daysAgo);
    for (const [meal, name, kcal, proteinG, fatG] of [
      ['breakfast', 'Greek yogurt with oats', 500, 40, 12],
      ['lunch', 'Chicken rice bowl', 800, 60, 20],
      ['dinner', 'Salmon with potatoes', 900, 70, 35],
    ] as const) {
      await repos.food.addFood(
        new FoodEntry({ id: 0, date, meal, name, kcal, proteinG, carbsG: (kcal - 4 * proteinG - 9 * fatG) / 4, fatG, source: 'weighed', fiberG: 8, sodiumMg: 600 }),
      );
    }
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  await repos.dailySteps.saveDailySteps(Array.from({ length: 35 }, (_, daysAgo) => ({ date: today.addDays(-daysAgo), steps: daysAgo < 7 ? 6100 : 8600 })));
};
