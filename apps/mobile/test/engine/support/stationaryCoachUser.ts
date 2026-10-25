import { CarbFatBalance } from '../../../src/domain/CarbFatBalance';
import type { CalendarDate } from '../../../src/domain/CalendarDate';
import { fiberGuideG } from '../../../src/domain/food/fiber/fiberGuideG';
import type { FoodEntry } from '../../../src/domain/FoodEntry';
import type { GoalMode } from '../../../src/domain/GoalMode';
import type { IntakeDay } from '../../../src/domain/IntakeDay';
import type { Meal } from '../../../src/domain/Meal';
import type { Workout } from '../../../src/domain/training/Workout';
import { WaterEntry } from '../../../src/domain/water/WaterEntry';
import type { FoodAnalysisInput } from '../../../src/engine/analysis/food/FoodAnalysisInput';
import type { TrainingAnalysisInput } from '../../../src/engine/analysis/TrainingAnalysisInput';
import { DartRandom } from '../../support/DartRandom';
import { food, intakeOf, safeguards, targets } from './foodAnalysis';
import { liftSession } from './liftSession';
import { trainingInput } from './trainingInput';

const goals: readonly GoalMode[] = ['fatLoss', 'maintenance', 'leanGain'];

/** The four meals of a day and their shares of it, as `plainDay` splits one. */
const meals: readonly (readonly [Meal, number])[] = [
  ['breakfast', 0.2],
  ['lunch', 0.3],
  ['dinner', 0.4],
  ['snack', 0.1],
];

/** Upper and lower days of a 4-day split: every major group gets 4 hard sets a session (MM-78's groups). */
const upper = (rir: () => number) =>
  [
    ['barbell-bench-press', 4, 8, 80, rir()],
    ['barbell-row', 4, 8, 70, rir()],
    ['barbell-overhead-press', 4, 8, 45, rir()],
  ] as const;
const lower = (rir: () => number) =>
  [
    ['back-squat', 4, 6, 100, rir()],
    ['romanian-deadlift', 4, 8, 90, rir()],
    ['barbell-hip-thrust', 4, 10, 100, rir()],
  ] as const;

/**
 * A stationary simulated person for the coach's cross-signal null
 * simulation (MM-605's false-alarm budget over MM-606's and MM-609's
 * signals together): nothing about their eating or training changes, so
 * every fix the coach raises is false. Deterministic for a seed.
 *
 * - **Goal** by seed: fat loss (estimated energy use 500 kcal above the
 *   target), maintenance (at it) or lean gain (150 kcal under it, an
 *   intermediate lifter's 0.25% a week), the estimate updated with a 150
 *   kcal standard deviation.
 * - **Food** around the fixture's ordinary targets (2,400 kcal, protein
 *   170 g with a 140 g minimum, fat 70 g): each day's calories, protein and
 *   fat are the target times 1 plus a normal draw, with a person's own
 *   day-to-day spread (calories and protein 8–15%, fat 12–22%), protein and
 *   fat correlated 0.5 with calories, and a little carry-over from one day
 *   to the next (lag-1 up to 0.2). Fiber averages the guide (spread 25%),
 *   sodium 1,900 mg against a 2,300 mg limit (spread 20%). Each day is
 *   four meals of foods eaten that day only, as `plainDay` builds them.
 *   One day in ten is unlogged and one in twenty-five half logged.
 * - **Training** an upper and lower split on Monday, Tuesday, Thursday and
 *   Friday, each session kept with probability 0.9, loads and reps fixed,
 *   reps in reserve 1 to 3 on every set.
 * - **Water** logged on 9 days in 10, around the 2,500 ml suggested goal
 *   (spread 350 ml), training days alike.
 */
export function stationaryCoachUser(
  seed: number,
  start: CalendarDate,
  days: number,
): { readonly goal: GoalMode; readonly food: FoodAnalysisInput; readonly training: (asOf: CalendarDate) => TrainingAnalysisInput } {
  const random = new DartRandom(seed);
  const normal = () => {
    const u1 = 1 - random.nextDouble();
    const u2 = random.nextDouble();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const goal = goals[seed % goals.length] as GoalMode;
  const tdeeKcal = goal === 'fatLoss' ? 2900 : goal === 'maintenance' ? 2400 : 2250;
  const weeklyRateFraction = goal === 'fatLoss' ? -0.0075 : goal === 'maintenance' ? 0 : 0.0025;
  const history = [
    targets(start.addDays(-200), { mode: goal, tdeeKcal, tdeeSigmaKcal: 150, tdeeStatus: 'updated', weeklyRateFraction }),
  ];
  const kcalSpread = 0.08 + 0.07 * random.nextDouble();
  const proteinSpread = 0.08 + 0.07 * random.nextDouble();
  const fatSpread = 0.12 + 0.1 * random.nextDouble();
  const carry = 0.2 * random.nextDouble();
  const fiberMeanG = fiberGuideG({ kcalTarget: 2400, sex: 'male' });
  const correlated = Math.sqrt(1 - 0.5 * 0.5);
  const step = (z: number) => carry * z + Math.sqrt(1 - carry * carry) * normal();

  const entries: FoodEntry[] = [];
  const intake: IntakeDay[] = [];
  const workouts: Workout[] = [];
  const water: WaterEntry[] = [];
  let zKcal = normal();
  let zProtein = normal();
  let zFat = normal();
  const rir = () => 1 + random.nextInt(3);
  for (let i = 0; i < days; i++) {
    const date = start.addDays(i);
    if (i > 0) {
      zKcal = step(zKcal);
      zProtein = step(zProtein);
      zFat = step(zFat);
    }
    const kcal = Math.max(800, 2400 * (1 + kcalSpread * zKcal));
    const proteinG = Math.max(40, 170 * (1 + proteinSpread * (0.5 * zKcal + correlated * zProtein)));
    const fatG = Math.max(20, 70 * (1 + fatSpread * (0.5 * zKcal + correlated * zFat)));
    const fiberG = Math.max(0, fiberMeanG * (1 + 0.25 * normal()));
    const sodiumMg = Math.max(0, 1900 * (1 + 0.2 * normal()));
    const draw = random.nextDouble();
    if (draw >= 0.1) {
      const partial = draw < 0.14;
      const eaten = partial ? meals.slice(0, 2) : meals;
      const day = eaten.map(([meal, share]) =>
        food(date, meal, `${meal} of ${date.toString()}`, kcal * share, proteinG * share, fatG * share, {
          fiberG: fiberG * share,
          sodiumMg: sodiumMg * share,
        }),
      );
      entries.push(...day);
      intake.push(intakeOf(date, day, { completeness: partial ? 'partial' : 'complete' }));
    }

    const weekday = date.weekday;
    if ([1, 2, 4, 5].includes(weekday) && random.nextDouble() < 0.9) {
      workouts.push(liftSession(date, weekday === 1 || weekday === 4 ? upper(rir) : lower(rir)));
    }
    if (random.nextDouble() < 0.9) {
      const ml = Math.max(250, Math.round(2500 + 350 * normal()));
      water.push(new WaterEntry({ id: i + 1, date, ml, at: new Date(date.year, date.month - 1, date.day, 12) }));
    }
  }

  const foodInput: FoodAnalysisInput = {
    entries,
    intake,
    history,
    safeguards: safeguards(),
    markedDays: new Map(),
    fatMinimumG: (kcalTarget) => Math.max(0.5 * 80, (0.2 * kcalTarget) / 9),
    balance: new CarbFatBalance({ fatShare: CarbFatBalance.issuedFatShare }),
    weightKg: 80,
    fiber: { sex: 'male', checkIns: [] },
    sodium: { limitMg: 2300, since: start.addDays(-200) },
    calorieFloorKcal: 1500,
  };
  const wholeDays = intake.filter((d) => d.completeness !== 'partial');
  return {
    goal,
    food: foodInput,
    training: (asOf) =>
      trainingInput(asOf, {
        goal,
        workouts,
        history,
        water,
        waterGoal: { ml: 2500, suggested: true, suggestedMl: 2500 },
        wholeDays,
      }),
  };
}
