import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyWorkout } from './storyWorkout';
import { storyTargets } from './storyTargets';

/**
 * A week of food where nothing stands out for the Coach tab's analysis (MM-610): on a cut at 2,400 kcal, protein
 * 150 g with a 140 g minimum, the 7 days through yesterday logged in full at 2,000 kcal (a light breakfast and a large
 * dinner), protein at the minimum on 4 of them and fat a little under its target, so nothing is a fix and nothing a
 * strength; nothing logged today. With `trained`, three
 * sessions in that week, the first log of training, so a week cannot judge training or strength yet.
 */
export const quietWeekScenario =
  ({ trained = false }: { trained?: boolean } = {}): StoryScenario =>
  async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-30), { kcal: 2400, proteinG: 150, proteinMinimumG: 140, fatG: 70, carbsG: 180, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
    );
    for (let i = 0; i <= 28; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.05);
    for (let i = 1; i <= 7; i++) {
      const date = today.addDays(-i);
      const day = (meal: 'breakfast' | 'dinner', kcal: number, proteinG: number, fatG: number) =>
        repos.food.addFood(
          new FoodEntry({ id: 0, date, meal, name: `Usual ${meal}`, kcal, proteinG, carbsG: (kcal - 4 * proteinG - 9 * fatG) / 4, fatG, source: 'weighed' }),
        );
      await day('breakfast', 600, 10, 17);
      await day('dinner', 1400, i <= 4 ? 135 : 115, 40);
      await repos.dayMarks.setCompleteness(date, 'complete');
    }
    if (trained) {
      for (const daysAgo of [6, 4, 2]) {
        await repos.workouts.saveWorkout(storyWorkout(today.addDays(-daysAgo), [['back-squat', 5, 80], ['barbell-bench-press', 5, 60]]));
      }
    }
  };
