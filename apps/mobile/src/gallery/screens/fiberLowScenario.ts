import { FoodEntry } from '../../domain/FoodEntry';
import { RecoveryCheckIn } from '../../domain/RecoveryCheckIn';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * On a cut at Full detail, a fortnight logged whole at about 11 g of fiber
 * a day against a guide near 31 g, and hunger at the hard end at the last
 * check-in (MM-126): the fiber insight, naming foods already logged. Weight
 * coming down on pace, so no stall competes with it, and every day on its
 * calories, protein, fat and carbohydrate, so the coach's analysis finds
 * nothing else to change.
 *
 * The insight has been on the card since two days ago. The analysis's own
 * fiber line (N12, the same rule) was first said as of yesterday, and what
 * is showing keeps showing (MM-610); as a new start the analysis would win
 * the tie of two education lines.
 */
export const fiberLowScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-70), healthCheckConfirmedOn: today }));
  await repos.preferences.saveDetailLevel('full');
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-60), { kcal: 2200, proteinG: 170, proteinMinimumG: 130, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
  );
  await repos.recovery.saveRecoveryCheckIn(
    new RecoveryCheckIn({ date: today.addDays(-3), hunger: 2, energy: 4, sleep: 4, training: 4, mood: 4 }),
  );
  for (let i = 0; i <= 28; i++) {
    const date = today.addDays(-i);
    await repos.weights.saveWeight(date, 82 + i * 0.09);
    if (i === 0 || i > 14) continue;
    const food = (name: string, kcal: number, proteinG: number, fatG: number, fiberG: number) =>
      new FoodEntry({
        id: 0,
        date,
        meal: 'lunch',
        name,
        kcal,
        proteinG,
        carbsG: Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4),
        fatG,
        source: 'weighed',
        fiberG,
      });
    await repos.food.addFood(food('Chicken and rice', 1906, 165, 55, 2));
    await repos.food.addFood(food('Lentil soup', 230, 15, 4, 5));
    await repos.food.addFood(food('Raspberries', 64, 1, 1, 4));
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  await repos.insightLog.recordInsightShown('fiberForFullness', today.addDays(-2));
};
