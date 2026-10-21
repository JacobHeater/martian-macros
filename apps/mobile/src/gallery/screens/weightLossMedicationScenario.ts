import type { CalendarDate } from '../../domain/CalendarDate';
import { FoodEntry } from '../../domain/FoodEntry';
import { ScreeningAnswers } from '../../domain/ScreeningAnswers';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Seventy days into a cut on a prescription weight-loss medication (MM-113,
 * MM-510), or the same person with the answer not ticked: no training days
 * set, the weight falling fast enough that targets were raised for a safe
 * pace three days ago, the last two weeks eaten at `pastKcal` (far below the
 * floor by default) and `todayKcal` logged today against 2,100 kcal.
 */
export const weightLossMedicationScenario =
  ({ ticked = true, pastKcal = 900, todayKcal = 900 }: { ticked?: boolean; pastKcal?: number; todayKcal?: number } = {}): StoryScenario =>
  async (repos, today) => {
    const setup = typicalSetup({
      onboardedOn: today.addDays(-70),
      healthCheckConfirmedOn: today,
      screening: new ScreeningAnswers({ weightLossMedication: ticked }),
    });
    await repos.setup.saveSetup(setup.copyWith({ trainingDaysPerWeek: 0 }));
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-60), { kcal: 1900, proteinG: 160, proteinMinimumG: 130, carbsG: 180, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
    );
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-3), {
        kcal: 2100,
        proteinG: 160,
        proteinMinimumG: 130,
        carbsG: 220,
        tdeeSigmaKcal: 150,
        tdeeStatus: 'updated',
        flags: ['raisedForSafePace'],
      }),
    );
    // About 1.4 kg a week for ten weeks.
    for (let i = 70; i >= 0; i--) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.2);
    const eat = (day: CalendarDate, kcal: number) =>
      repos.food.addFood(
        new FoodEntry({
          id: 0,
          date: day,
          meal: 'dinner',
          name: 'Demo day of food',
          kcal,
          proteinG: Math.round(kcal / 15),
          carbsG: Math.round(kcal / 9),
          fatG: Math.round(kcal / 36),
          source: 'weighed',
        }),
      );
    for (let i = 1; i <= 14; i++) {
      await eat(today.addDays(-i), pastKcal);
      await repos.dayMarks.setCompleteness(today.addDays(-i), 'complete');
    }
    await eat(today, todayKcal);
  };
