import { CalendarDate } from '../../../src/domain/CalendarDate';
import type { GoalMode } from '../../../src/domain/GoalMode';
import { Profile } from '../../../src/domain/Profile';
import { ScreeningAnswers } from '../../../src/domain/ScreeningAnswers';
import { builtInExercises } from '../../../src/domain/training/builtInExercises';
import { UserSetup } from '../../../src/domain/UserSetup';
import type { TrainingAnalysisInput } from '../../../src/engine/analysis/TrainingAnalysisInput';
import { targetsFrom } from '../../support/targetsFrom';

/**
 * What the training analysis reads (MM-609), for a 36-year-old man on
 * `goal` since 120 days before `asOf`, with nothing logged unless given.
 */
export function trainingInput(
  asOf: CalendarDate,
  { goal = 'maintenance', ...rest }: Partial<Omit<TrainingAnalysisInput, 'setup'>> & { goal?: GoalMode } = {},
): TrainingAnalysisInput {
  const setup = new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 4,
    goalMode: goal,
    onboardedOn: asOf.addDays(-120),
    unitSystem: 'metric',
  });
  return {
    setup,
    workouts: [],
    exercises: builtInExercises,
    weights: [],
    pauses: [],
    history: [targetsFrom(asOf.addDays(-120), { mode: goal, weeklyRateFraction: goal === 'fatLoss' ? -0.0075 : 0, proteinMinimumG: 130 })],
    deficitRestartOn: undefined,
    progressStalled: false,
    sleep: [],
    water: [],
    waterGoal: undefined,
    wholeDays: [],
    safeguards: { eatingDisorderHistory: false, underEating: false },
    cardio: [],
    steps: [],
    cardioFloors: { stepsPerDay: undefined, minutesPerWeek: undefined },
    ...rest,
  };
}
