import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';
import { storyWorkout } from './storyWorkout';

/**
 * Forty days in, weighed every morning around 82 kg and logged whole at
 * 2,200 kcal and 230 g of carbohydrate, with today's weigh-in far from the
 * trend (MM-142). What yesterday held decides what the explanation finds:
 * nothing out of the ordinary unless given.
 */
export function weightJumpScenario({
  todayKg = 83.3,
  yesterdaysCarbsG = 230,
  yesterdaysKcal = 2200,
  workoutYesterday = false,
  illnessYesterday = false,
}: {
  todayKg?: number;
  yesterdaysCarbsG?: number;
  yesterdaysKcal?: number;
  workoutYesterday?: boolean;
  illnessYesterday?: boolean;
} = {}): StoryScenario {
  return async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(storyTargets(today.addDays(-40), { kcal: 2200, carbsG: 230, tdeeKcal: 2500 }));
    for (let daysAgo = 40; daysAgo >= 1; daysAgo--) {
      const day = today.addDays(-daysAgo);
      await repos.weights.saveWeight(day, 82 + (daysAgo % 2 === 0 ? 0.1 : -0.1));
      const yesterday = daysAgo === 1;
      await repos.food.addFood(
        new FoodEntry({
          id: 0,
          date: day,
          meal: 'dinner',
          name: 'Demo day of food',
          kcal: yesterday ? yesterdaysKcal : 2200,
          proteinG: 150,
          carbsG: yesterday ? yesterdaysCarbsG : 230,
          fatG: 70,
          source: 'weighed',
        }),
      );
      await repos.dayMarks.setCompleteness(day, 'complete');
    }
    await repos.weights.saveWeight(today, todayKg);
    if (workoutYesterday) await repos.workouts.saveWorkout(storyWorkout(today.addDays(-1), [['back-squat', 5, 100]]));
    if (illnessYesterday) await repos.weightEvents.saveWeightEvent({ date: today.addDays(-1), type: 'illness' });
  };
}
