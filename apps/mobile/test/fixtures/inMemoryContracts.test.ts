import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { customExerciseRepositoryContract } from '../contracts/customExerciseRepositoryContract';
import { customFoodRepositoryContract } from '../contracts/customFoodRepositoryContract';
import { dataEraserContract } from '../contracts/dataEraserContract';
import { dayMarkRepositoryContract } from '../contracts/dayMarkRepositoryContract';
import { exerciseProgressionRepositoryContract } from '../contracts/exerciseProgressionRepositoryContract';
import { foodRepositoryContract } from '../contracts/foodRepositoryContract';
import { insightLogRepositoryContract } from '../contracts/insightLogRepositoryContract';
import { intakeReaderContract } from '../contracts/intakeReaderContract';
import { pauseRepositoryContract } from '../contracts/pauseRepositoryContract';
import { preferencesRepositoryContract } from '../contracts/preferencesRepositoryContract';
import { recoveryCheckInRepositoryContract } from '../contracts/recoveryCheckInRepositoryContract';
import { reminderRepositoryContract } from '../contracts/reminderRepositoryContract';
import { setupRepositoryContract } from '../contracts/setupRepositoryContract';
import { targetsHistoryRepositoryContract } from '../contracts/targetsHistoryRepositoryContract';
import { waistRepositoryContract } from '../contracts/waistRepositoryContract';
import { waterRepositoryContract } from '../contracts/waterRepositoryContract';
import { weightEventRepositoryContract } from '../contracts/weightEventRepositoryContract';
import { weightRepositoryContract } from '../contracts/weightRepositoryContract';
import { workoutRepositoryContract } from '../contracts/workoutRepositoryContract';

/**
 * Runs every repository contract against the in-memory implementations. The
 * database's implementations run the same suites.
 */
setupRepositoryContract('In-memory', () => new InMemoryRepositories().setup);
weightRepositoryContract('In-memory', () => new InMemoryRepositories().weights);
weightEventRepositoryContract('In-memory', () => new InMemoryRepositories().weightEvents);
waistRepositoryContract('In-memory', () => new InMemoryRepositories().waist);
waterRepositoryContract('In-memory', () => new InMemoryRepositories().water);
preferencesRepositoryContract('In-memory', () => new InMemoryRepositories().preferences);
foodRepositoryContract('In-memory', () => new InMemoryRepositories().food);
customFoodRepositoryContract('In-memory', () => new InMemoryRepositories().customFoods);
dayMarkRepositoryContract('In-memory', () => new InMemoryRepositories().dayMarks);
targetsHistoryRepositoryContract('In-memory', () => new InMemoryRepositories().targets);
insightLogRepositoryContract('In-memory', () => new InMemoryRepositories().insightLog);
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
    preferences: r.preferences,
    workouts: r.workouts,
    customExercises: r.customExercises,
  };
});
