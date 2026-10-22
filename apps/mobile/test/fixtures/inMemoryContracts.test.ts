import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { customExerciseRepositoryContract } from '../contracts/customExerciseRepositoryContract';
import { customFoodRepositoryContract } from '../contracts/customFoodRepositoryContract';
import { dataEraserContract } from '../contracts/dataEraserContract';
import { dayMarkRepositoryContract } from '../contracts/dayMarkRepositoryContract';
import { exerciseProgressionRepositoryContract } from '../contracts/exerciseProgressionRepositoryContract';
import { foodRepositoryContract } from '../contracts/foodRepositoryContract';
import { goalBodyFatRepositoryContract } from '../contracts/goalBodyFatRepositoryContract';
import { InMemoryGoalBodyFatRepository } from '../../src/fixtures/InMemoryGoalBodyFatRepository';
import { inlineInsightLogRepositoryContract } from '../contracts/inlineInsightLogRepositoryContract';
import { insightLogRepositoryContract } from '../contracts/insightLogRepositoryContract';
import { insightSnoozeRepositoryContract } from '../contracts/insightSnoozeRepositoryContract';
import { intakeReaderContract } from '../contracts/intakeReaderContract';
import { pauseRepositoryContract } from '../contracts/pauseRepositoryContract';
import { preferencesRepositoryContract } from '../contracts/preferencesRepositoryContract';
import { recoveryCheckInRepositoryContract } from '../contracts/recoveryCheckInRepositoryContract';
import { reminderRepositoryContract } from '../contracts/reminderRepositoryContract';
import { setupRepositoryContract } from '../contracts/setupRepositoryContract';
import { sleepRepositoryContract } from '../contracts/sleepRepositoryContract';
import { targetShapeRepositoryContract } from '../contracts/targetShapeRepositoryContract';
import { targetsHistoryRepositoryContract } from '../contracts/targetsHistoryRepositoryContract';
import { menstruationRepositoryContract } from '../contracts/menstruationRepositoryContract';
import { onlineFoodCacheContract } from '../contracts/onlineFoodCacheContract';
import { InMemoryOnlineFoodCache } from '../../src/foodCatalog/online/InMemoryOnlineFoodCache';
import { waistRepositoryContract } from '../contracts/waistRepositoryContract';
import { measurementRepositoryContract } from '../contracts/measurementRepositoryContract';
import { measurementSettingsRepositoryContract } from '../contracts/measurementSettingsRepositoryContract';
import { waterRepositoryContract } from '../contracts/waterRepositoryContract';
import { weightEventRepositoryContract } from '../contracts/weightEventRepositoryContract';
import { weightRepositoryContract } from '../contracts/weightRepositoryContract';
import { weighInWindowContract } from '../contracts/weighInWindowContract';
import { workoutRepositoryContract } from '../contracts/workoutRepositoryContract';

/**
 * Runs every repository contract against the in-memory implementations. The
 * database's implementations run the same suites.
 */
setupRepositoryContract('In-memory', () => new InMemoryRepositories().setup);
weightRepositoryContract('In-memory', () => new InMemoryRepositories().weights);
weightEventRepositoryContract('In-memory', () => new InMemoryRepositories().weightEvents);
waistRepositoryContract('In-memory', () => new InMemoryRepositories().waist);
measurementRepositoryContract('In-memory', () => new InMemoryRepositories().measurements);
measurementSettingsRepositoryContract('In-memory', () => new InMemoryRepositories().measurementSettings);
menstruationRepositoryContract('In-memory', () => new InMemoryRepositories().flowDays);
onlineFoodCacheContract('In-memory', () => new InMemoryOnlineFoodCache());
sleepRepositoryContract('In-memory', () => new InMemoryRepositories().sleep);
waterRepositoryContract('In-memory', () => new InMemoryRepositories().water);
preferencesRepositoryContract('In-memory', () => new InMemoryRepositories().preferences);
foodRepositoryContract('In-memory', () => new InMemoryRepositories().food);
customFoodRepositoryContract('In-memory', () => new InMemoryRepositories().customFoods);
dayMarkRepositoryContract('In-memory', () => new InMemoryRepositories().dayMarks);
targetsHistoryRepositoryContract('In-memory', () => new InMemoryRepositories().targets);
targetShapeRepositoryContract('In-memory', () => new InMemoryRepositories().targetShapes);
insightLogRepositoryContract('In-memory', () => new InMemoryRepositories().insightLog);
inlineInsightLogRepositoryContract('In-memory', () => new InMemoryRepositories().inlineInsightLog);
insightSnoozeRepositoryContract('In-memory', () => new InMemoryRepositories().insightSnoozes);
// MM-36: not in `InMemoryRepositories` until its table (MM-507) puts it in the app.
goalBodyFatRepositoryContract('In-memory', () => new InMemoryGoalBodyFatRepository());
weighInWindowContract('In-memory', () => new InMemoryRepositories().weighInWindow);
pauseRepositoryContract('In-memory', () => new InMemoryRepositories().pauses);
reminderRepositoryContract('In-memory', () => new InMemoryRepositories().reminders);
recoveryCheckInRepositoryContract('In-memory', () => new InMemoryRepositories().recovery);
workoutRepositoryContract('In-memory', () => new InMemoryRepositories().workouts);
exerciseProgressionRepositoryContract('In-memory', () => new InMemoryRepositories().exerciseProgressions);
customExerciseRepositoryContract('In-memory', () => new InMemoryRepositories().customExercises);
intakeReaderContract('In-memory', () => {
  const r = new InMemoryRepositories();
  return { food: r.food, marks: r.dayMarks, intake: r.intake };
});
dataEraserContract('In-memory', () => {
  const r = new InMemoryRepositories();
  return {
    eraser: r.eraser,
    setup: r.setup,
    weights: r.weights,
    weightEvents: r.weightEvents,
    food: r.food,
    targets: r.targets,
    targetShapes: r.targetShapes,
    goalBodyFat: r.goalBodyFat,
    measurements: r.measurements,
    measurementSettings: r.measurementSettings,
    preferences: r.preferences,
    weighInWindow: r.weighInWindow,
    workouts: r.workouts,
    customExercises: r.customExercises,
  };
});
