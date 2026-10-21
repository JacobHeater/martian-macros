import { FoodEntry } from '../../domain/FoodEntry';
import { RecoveryCheckIn } from '../../domain/RecoveryCheckIn';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * On a cut at Full detail, a fortnight logged whole at about 11 g of fiber
 * a day against a guide near 31 g, and hunger at the hard end at the last
 * check-in (MM-126): the fiber insight, naming foods already logged. Weight
 * coming down on pace, so no stall competes with it.
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
    const food = (name: string, kcal: number, proteinG: number, fiberG: number) =>
      new FoodEntry({ id: 0, date, meal: 'lunch', name, kcal, proteinG, carbsG: 0, fatG: 0, source: 'weighed', fiberG });
    await repos.food.addFood(food('Chicken and rice', 1906, 165, 2));
    await repos.food.addFood(food('Lentil soup', 230, 15, 5));
    await repos.food.addFood(food('Raspberries', 64, 1, 4));
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
};
