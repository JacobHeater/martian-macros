import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import type { InsightPreview } from '../../coach/InsightPreview';
import type { RecentInsight } from '../../coach/RecentInsight';
import { FoodEntry } from '../../domain/FoodEntry';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import type { Portion } from '../../domain/food/portion/Portion';
import { InsightSwitches } from '../../domain/InsightSwitches';
import type { Meal } from '../../domain/Meal';
import { Workout } from '../../domain/training/Workout';
import { WorkoutExercise } from '../../domain/training/WorkoutExercise';
import { WorkoutSet } from '../../domain/training/WorkoutSet';
import { FoodGradeRule } from '../../engine/FoodGradeRule';
import { ItemAnchor } from '../../engine/ItemAnchor';
import { WaterEntry } from '../../domain/water/WaterEntry';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { FoodGradeLetter } from '../../domain/food/grade/FoodGradeLetter';
import type { FoodGradeValue } from '../../domain/food/grade/FoodGradeValue';
import { showAddFoodSheet } from '../../food/showAddFoodSheet';
import { CoachAreaScreen } from '../../settings/CoachAreaScreen';
import { CoachSettingsScreen } from '../../settings/CoachSettingsScreen';
import { SettingsScreen } from '../../settings/SettingsScreen';
import { WorkoutScreen } from '../../train/WorkoutScreen';
import { demoWith } from './demoWith';
import { draftInsightKinds } from './draftInsightKinds';
import { reveal } from './reveal';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import { storyToday } from './storyToday';
import { valueOf } from './valueOf';

/**
 * The design of coaching insights inline (MM-361) and food grades
 * (MM-370), drawn on the real screens before either is built (MM-293).
 * The lines, grades and recent insights here are the design's own figures,
 * handed in through the insight preview, not worked out by the engine;
 * the rules that will produce them are drafted in MM-365 to MM-368, and
 * the grading method waits for MM-369.
 */
const meta = { title: 'Designs/Coaching insights', ...screensMeta } satisfies Meta;
export default meta;

/** The design's own letter, with the top score of its step as its score (MM-369). */
const graded = (letter: FoodGradeLetter): FoodGradeValue => ({
  kind: 'graded',
  letter,
  score: FoodGradeRule.letterSteps[FoodGradeLetter.values.indexOf(letter)] ?? -12,
  notCounted: [],
  statedMicronutrients: 10,
});

// ---- Food: the owner's example, a food high in fat, with the coach's line under it ----

const soupReason =
  'It was entered by its totals, with no fiber or sodium value. The grade needs both, and a missing value is never counted as zero.';

const foodPreview: InsightPreview = {
  entryGrades: new Map<string, FoodGradeValue>([
    ['Demo oats and yogurt', graded('B+')],
    ['Demo chicken and rice', graded('B')],
    ['Demo tofu and potatoes', graded('A-')],
    ['Demo fruit and nuts', graded('B')],
    ['Peanut butter', graded('C')],
    ['Pasta with cream sauce', graded('C-')],
    ['Garlic bread', graded('D+')],
    ['Homemade soup', { kind: 'ungradable', reason: soupReason }],
  ]),
  mealGrades: new Map<Meal, FoodGradeValue>([
    ['breakfast', graded('B+')],
    ['lunch', graded('C')],
    ['dinner', graded('A-')],
    [
      'snack',
      {
        kind: 'ungradable',
        // Peanut butter and the fruit are graded, the soup is not: 456 of 676 kcal.
        reason: 'Only 67% of this meal’s calories come from foods that can be graded. A meal’s grade needs at least 70%.',
      },
    ],
  ]),
  dayGrade: graded('B-'),
};

/**
 * With an eating-disorder history the grades stay (the owner's call); the lines about fat and about a
 * large portion go (MM-362, and the panel's request on portions), and protein's stays.
 */
/**
 * Yesterday's demo day with a lunch, a snack and a typed soup that the
 * insights and grades are about. The app works the lines out itself
 * (MM-365): the pasta is light on protein, the peanut butter mostly fat,
 * and the garlic bread, logged as 4 servings, gets the portion check.
 */
const extraFoods: StoryScenario = async (repos, today) => {
  const date = today.addDays(-1);
  const add = (meal: Meal, name: string, kcal: number, proteinG: number, carbsG: number, fatG: number, source: FoodEntry['source'], portion?: Portion) =>
    repos.food.addFood(new FoodEntry({ id: 0, date, meal, name, kcal, proteinG, carbsG, fatG, source, portion }));
  await add('lunch', 'Pasta with cream sauce', 640, 14, 70, 32, 'weighed');
  await add('lunch', 'Garlic bread', 350, 8, 40, 17, 'labelServing', {
    method: 'labelServing',
    basis: 'calculated',
    quantity: 4,
    unit: 'serving',
    reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 87.5, proteinG: 2, carbsG: 10, fatG: 4.25 }), servingDescription: '1 slice', servingGrams: 30 },
  });
  await add('snack', 'Peanut butter', 190, 7, 7, 16, 'labelServing');
  await add('snack', 'Homemade soup', 220, 9, 30, 6, 'quickAdd');
};

const yesterdaysFood = ({ state, today }: StoryStage) => {
  state.homeTab.put('food');
  state.selectedDay.put(today.addDays(-1));
};

/** Waits for an element named `name` and scrolls it into the phone's view. */
const revealed = (name: string | RegExp, role = 'button') => async (canvas: HTMLElement) => {
  const element = await within(canvas).findByRole(role, { name }, { timeout: 10000 });
  reveal(element);
  return element;
};

/** MM-362, MM-370: the coach's lines under three foods, every entry, meal and the day graded. */
export const FoodWithInsights = screenStory({
  covers: ['FoodScreen'],
  shows: /^Most of this food’s calories come from fat/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Most of this food/)(canvas)),
});

/** MM-365: lunch with two lines, one under each of its foods. */
export const FoodTwoInsightsInOneMeal = screenStory({
  covers: ['FoodScreen'],
  shows: /^Logged as 4 servings/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: 14 g of protein in 640 kcal/)(canvas)),
});

/**
 * MM-393: biscuits logged as three servings, light on protein. Both rules hold on the one entry, so both
 * lines show under it, the portion check (data quality) before the protein line (pattern).
 */
const biscuits: StoryScenario = async (repos, today) => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today.addDays(-1),
      meal: 'breakfast',
      name: 'Biscuits',
      kcal: 780,
      proteinG: 12,
      carbsG: 78,
      fatG: 45,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: 3,
        unit: 'serving',
        reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 260, proteinG: 4, carbsG: 26, fatG: 15 }), servingDescription: '1 biscuit', servingGrams: 66 },
      },
    }),
  );
};

/** MM-393: two rules hold on one food, and each says its own line under it. */
export const FoodTwoInsightsOnOneEntry = screenStory({
  covers: ['FoodScreen'],
  shows: /^12 g of protein in 780 kcal/,
  scenario: demoWith({ then: biscuits }),
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Logged as 3 servings/)(canvas)),
});

/**
 * MM-393, the worst case the panel asked to see: croissants logged as four servings, mostly fat and light on
 * protein, so all three food rules hold and three lines stack under the one entry.
 */
const croissants: StoryScenario = async (repos, today) => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today.addDays(-1),
      meal: 'breakfast',
      name: 'Croissants',
      kcal: 920,
      proteinG: 16,
      carbsG: 84,
      fatG: 58,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: 4,
        unit: 'serving',
        reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 230, proteinG: 4, carbsG: 21, fatG: 14.5 }), servingDescription: '1 croissant', servingGrams: 57 },
      },
    }),
  );
};

/** MM-393: three rules hold on one food: three lines, the portion check first. */
export const FoodThreeInsightsOnOneEntry = screenStory({
  covers: ['FoodScreen'],
  shows: /^Most of this food’s calories come from fat \(57%\)/,
  scenario: demoWith({ then: croissants }),
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Logged as 4 servings/)(canvas)),
});

/** MM-362: the line opened: what it rests on, and the way to its switch. */
export const FoodInsightOpen = screenStory({
  covers: ['FoodScreen'],
  shows: 'The numbers behind this',
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: Most of this food/)(canvas));
    reveal(await within(canvas).findByRole('button', { name: 'Settings for “Mostly fat”' }));
  },
});

/** MM-378: the opened line ends with the way to its switch and "Snooze…". */
export const FoodInsightSnooze = screenStory({
  covers: ['FoodScreen'],
  shows: /^Snooze…/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: Most of this food/)(canvas));
    reveal(await within(canvas).findByRole('button', { name: /^Snooze…/ }));
  },
});

/** MM-378: the lengths offered: a day, a week, a month, or until turned back on. */
export const FoodInsightSnoozeLengths = screenStory({
  covers: ['FoodScreen'],
  shows: 'Until I turn it back on',
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: Most of this food/)(canvas));
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Snooze…/ }));
  },
});

/** MM-378: snoozed for a week: the line is gone from under its food, and the message offers Undo. */
export const FoodInsightSnoozed = screenStory({
  covers: ['FoodScreen'],
  shows: /^Snoozed for Peanut butter/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: Most of this food/)(canvas));
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Snooze…/ }));
    const dialog = await within(canvas).findByRole('dialog', { name: /^Snooze “Mostly fat”/ });
    await userEvent.click(within(dialog).getByRole('option', { name: /^For a week/ }));
  },
});

/** MM-364: "Settings for “Mostly fat”" opens food's kinds, that one named, in view and focused. */
export const FoodInsightToSettings = screenStory({
  covers: ['FoodScreen', 'CoachAreaScreen'],
  shows: /^The insight you opened is this kind/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: Most of this food/)(canvas));
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Settings for “Mostly fat”' }));
  },
});

/** MM-370: a graded food pressed says what its grade means. */
export const FoodGradeMeaning = screenStory({
  covers: ['FoodScreen'],
  shows: /^A grade for the food itself, from what it gives per calorie/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('Grade C for Peanut butter')(canvas));
  },
});

/** MM-382: a graded food whose source left sugars, saturated fat and most vitamins and minerals unstated: the popover at its longest. */
export const FoodGradeNotCounted = screenStory({
  covers: ['FoodScreen'],
  shows: /Only 2 of the 10 vitamins and minerals/,
  scenario: demoWith({ then: extraFoods }),
  preview: {
    ...foodPreview,
    entryGrades: new Map<string, FoodGradeValue>([
      ...(foodPreview.entryGrades ?? new Map<string, FoodGradeValue>()),
      ['Peanut butter', { kind: 'graded', letter: 'C', score: -1, notCounted: ['sugars', 'saturatedFat', 'micronutrients'], statedMicronutrients: 2 }],
    ]),
  },
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('Grade C for Peanut butter')(canvas));
  },
});

/** MM-370: the day's grade in the header, pressed. */
export const FoodDayGradeMeaning = screenStory({
  covers: ['FoodScreen'],
  shows: 'The grades of this day’s foods, each counted by its calories.',
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('Grade B minus for This day')(canvas));
  },
});

/** MM-362, MM-370 (the panel's UX-4): the food log at 200% text, the line under Peanut butter in view. */
export const FoodLargeText = screenStory({
  covers: ['FoodScreen'],
  shows: /^Most of this food’s calories come from fat/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  textScale: 2,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Most of this food/)(canvas)),
});

/** MM-372 (the panel's UX-1, UX-4): the Snacks question mark at 200% text: the popover inside both edges. */
export const FoodMealGradeWhyLargeText = screenStory({
  covers: ['FoodScreen'],
  shows: /^Only 67% of this meal’s calories/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  textScale: 2,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('No grade for Snacks. Why?')(canvas));
  },
});

/** The panel's UX-4: the food log on a 320 px phone: the entry's calories, grade and More beside a narrow name. */
export const FoodNarrow = screenStory({
  covers: ['FoodScreen'],
  shows: /^Most of this food’s calories come from fat/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  viewport: 'narrowPhone',
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Most of this food/)(canvas)),
});

/** MM-370: a food that can't be graded: the question mark opens why. */
export const FoodGradeWhy = screenStory({
  covers: ['FoodScreen'],
  shows: soupReason,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('No grade for Homemade soup. Why?')(canvas));
  },
});

/** MM-370: a meal with too little that can be graded says so. */
export const FoodMealGradeWhy = screenStory({
  covers: ['FoodScreen'],
  shows: /^Only 67% of this meal’s calories/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('No grade for Snacks. Why?')(canvas));
  },
});

/** MM-362, MM-370: eating-disorder history: grades as for anyone, no line about fat, protein's line kept. */
export const FoodWithInsightsEatingDisorder = screenStory({
  covers: ['FoodScreen'],
  shows: /^14 g of protein in 640 kcal/,
  scenario: demoWith({ screening: { eatingDisorderHistory: true }, then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: 14 g of protein in 640 kcal/)(canvas)),
});

/** A grade for every food in the pack, from its name: the design's own letters, and one the method can't grade. */
const gradeOfFood = (name: string): FoodGradeValue => {
  if (/trail mix|cola/i.test(name)) return { kind: 'ungradable', reason: 'This food has no fiber value, which the grade needs.' };
  if (/chicken breast/i.test(name)) return graded('A');
  // A food already logged has the grade the log shows (MM-370: an entry shows its food's grade).
  const logged = foodPreview.entryGrades?.get(name);
  if (logged !== undefined) return logged;
  const letters: readonly FoodGradeLetter[] = ['A-', 'B+', 'B', 'B-', 'C+', 'C'];
  const sum = [...name].reduce((total, c) => total + c.charCodeAt(0), 0);
  return graded(letters[sum % letters.length] ?? 'B');
};

/** MM-370: grades beside each food in search, outside the part that is pressed. */
export const SearchWithGrades = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Chicken breast, cooked',
  preview: { gradeOfFood },
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today),
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'chicken');
    // The demo's log matches too, so their own come first (MM-652); the database's are a press away.
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Database' }, { timeout: 10000 }));
  },
});

/** MM-370: the amount step says the grade in words beside its letter. */
export const AmountStepWithGrade = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Grade for the food itself, per calorie',
  preview: { gradeOfFood },
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'chicken breast, cooked' }),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Chicken breast, cooked/ }, { timeout: 10000 }));
  },
});

// ---- Training: an exercise ----

/**
 * The demo trains once a week with two hard sets of bench press. One more
 * chest day this week, six sets two days ago, is a jump the app works out
 * itself (MM-366): 8 sets against about 2.
 */
const extraChestDay: StoryScenario = async (repos, today) => {
  const date = today.addDays(-2);
  const startedAt = new Date(date.year, date.month - 1, date.day, 18);
  await repos.workouts.saveWorkout(
    new Workout({
      id: 0,
      date,
      startedAt,
      endedAt: new Date(startedAt.getTime() + 40 * 60 * 1000),
      exercises: [
        new WorkoutExercise({
          exerciseId: 'barbell-bench-press',
          sets: Array.from({ length: 6 }, () => new WorkoutSet({ reps: 8, loadKg: 60, rir: 2 })),
        }),
      ],
    }),
  );
};

const lastWorkout = async (stage: StoryStage) => {
  const workout = (await valueOf(stage.services.workouts.watchWorkouts()))[0];
  if (workout !== undefined) void stage.navigator.push(() => <WorkoutScreen workoutId={workout.id} />);
};

/**
 * MM-366: "volume jump" under the bench press, the first chest exercise,
 * once. A new best is not an inline line: the workout's Personal records
 * card already says it.
 */
export const WorkoutWithInsights = screenStory({
  covers: ['WorkoutScreen'],
  shows: /^9 sets for chest in the 7 days to this workout/,
  scenario: demoWith({ then: extraChestDay }),
  open: lastWorkout,
  walk: async (canvas) => void (await revealed(/^Coach: 9 sets for chest/)(canvas)),
});

/** MM-366: the line opened. */
export const WorkoutInsightOpen = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Usual week, the 4 weeks before',
  scenario: demoWith({ then: extraChestDay }),
  open: lastWorkout,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: 9 sets for chest/)(canvas));
  },
});

/** The line the workout stories show, for the Coach tab's list: the demo's step-week bench (3 sets, MM-289) and the extra day's 6. */
const chestJump =
  '9 sets for chest in the 7 days to this workout. Your usual is about 2 a week. A jump this big can bring more ' +
  'soreness; adding sets more slowly is easier to recover from.';

// ---- The Dashboard: the waist and water ----

/**
 * The demo with a waist that moved a centimetre on a reading while the
 * smoothed answer is no clear change, and water on 4 of the 14 days before
 * today, so both lines are what the app works out (MM-367).
 */
const waistAndWater: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace({ ...repos, water: undefined, waist: undefined });
  const triple = (daysAgo: number, cm: number) => repos.waist.saveWaist(today.addDays(-daysAgo), cm, { readings: [cm - 0.2, cm, cm + 0.3] });
  await triple(28, 92.0);
  await triple(21, 92.2);
  await triple(14, 91.8);
  await triple(7, 92.0);
  await repos.waist.saveWaist(today, 93.0, { readings: [93.0] });
  for (const daysAgo of [0, 2, 5, 9, 12]) {
    const date = today.addDays(-daysAgo);
    await repos.water.addWater(new WaterEntry({ id: 0, date, ml: 500, at: new Date(date.year, date.month - 1, date.day, 9) }));
  }
};

/** MM-367: a line under the waist and water rows, inside their list group. */
export const DashboardWithInsights = screenStory({
  covers: ['DashboardScreen'],
  shows: /^Water logged on 4 of the last 14 days/,
  scenario: waistAndWater,
  walk: async (canvas) => void (await revealed(/^Coach: About the same as 4 weeks ago/)(canvas)),
});

/** MM-367: the waist line opened: the smoothed figures and what a change has to pass. */
export const DashboardWaistInsightOpen = screenStory({
  covers: ['DashboardScreen'],
  shows: 'A change has to pass',
  scenario: waistAndWater,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: About the same as 4 weeks ago/)(canvas));
  },
});

/** The panel's UX-4: the same rows at 200% text. */
export const DashboardLargeText = screenStory({
  covers: ['DashboardScreen'],
  shows: /^Water logged on 4 of the last 14 days/,
  scenario: waistAndWater,
  textScale: 2,
  walk: async (canvas) => void (await revealed(/^Coach: Water logged on 4/)(canvas)),
});

// ---- The Coach tab: what was said inline ----

const recent: readonly RecentInsight[] = [
  { area: 'food', item: 'Peanut butter, snack', day: storyToday.addDays(-1), line: 'Most of this food’s calories come from fat (76%). A protein food alongside balances the meal.' },
  { area: 'food', item: 'Pasta with cream sauce, lunch', day: storyToday.addDays(-1), line: '14 g of protein in 640 kcal. A protein food alongside is the easiest way to add some.' },
  { area: 'food', item: 'Granola bar, snack', day: storyToday.addDays(-6), line: 'Logged as 4 servings (480 kcal); one serving is 40 g. Right as logged? If not, the amount can be edited.', changed: true },
  { area: 'training', item: 'Barbell bench press', day: storyToday, line: chestJump },
  { area: 'body', item: 'Waist', day: storyToday, line: 'About the same as 4 weeks ago. A difference under 0.75 in is within what a tape can tell.' },
];

/** Opens the folded Recent insights section and brings it into view. */
const onCoach = async (canvas: HTMLElement) => {
  const header = await within(canvas).findByRole('button', { name: /^Recent insights/ }, { timeout: 10000 });
  await userEvent.click(header);
  reveal(header);
};

/** MM-363 (the panel's PD-6): folded to its count, as Monthly reports is. */
export const CoachRecentInsightsFolded = screenStory({
  covers: ['CoachScreen'],
  shows: /^5 in the last 14 days/,
  preview: { recent },
  open: ({ state }) => state.homeTab.put('coach'),
  walk: async (canvas) => reveal(await within(canvas).findByRole('button', { name: /^Recent insights/ }, { timeout: 10000 })),
});

/** MM-363: grouped by area, newest first; an item since changed says so and leads nowhere. */
export const CoachRecentInsights = screenStory({
  covers: ['CoachScreen'],
  shows: 'Item since changed',
  preview: { recent },
  open: ({ state }) => state.homeTab.put('coach'),
  walk: onCoach,
});

/** MM-363: a recent insight pressed leads back to its item's day on Food. */
export const CoachRecentInsightOpensItem = screenStory({
  covers: ['CoachScreen', 'FoodScreen'],
  shows: 'Yesterday',
  preview: { recent },
  open: ({ state }) => state.homeTab.put('coach'),
  walk: async (canvas) => {
    await onCoach(canvas);
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Peanut butter, snack/ }));
  },
});

/** The demo with the chest jump, and its line logged as shown today. */
const loggedChestJump: StoryScenario = demoWith({
  then: async (repos, today) => {
    await extraChestDay(repos, today);
    const workout = (await valueOf(repos.workouts.watchWorkouts()))[0];
    if (workout === undefined) return;
    await repos.inlineInsightLog.recordInlineInsightShown({
      kind: 'volumeJump',
      area: 'training',
      anchor: ItemAnchor.exercise(workout.id, 'barbell-bench-press'),
      item: 'Barbell bench press',
      line: chestJump,
      firstShownOn: today,
    });
  },
});

/** MM-363: what the app logged once the workout's line was shown, listed under Training and leading back to it. */
export const CoachRecentInsightsLogged = screenStory({
  covers: ['CoachScreen'],
  shows: /^1 in the last 14 days/,
  scenario: loggedChestJump,
  open: ({ state }) => state.homeTab.put('coach'),
  walk: onCoach,
});

/** MM-363: a lift's entry pressed opens the workout it was said in, with the line under the bench press. */
export const CoachRecentInsightOpensWorkout = screenStory({
  covers: ['CoachScreen', 'WorkoutScreen'],
  shows: /^9 sets for chest in the 7 days to this workout/,
  scenario: loggedChestJump,
  open: ({ state }) => state.homeTab.put('coach'),
  walk: async (canvas) => {
    await onCoach(canvas);
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Barbell bench press/ }));
  },
});

/** MM-363: nothing said inline in 14 days. */
export const CoachRecentInsightsNone = screenStory({
  covers: ['CoachScreen'],
  shows: /^The coach leaves an insight under a food/,
  preview: { recent: [] },
  open: ({ state }) => state.homeTab.put('coach'),
  walk: onCoach,
});

// ---- Settings > Coach ----

/** MM-364: Settings with its Coach section, after Today's setup. */
export const SettingsCoachSection = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Coaching insights',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="coach" />),
  walk: async (canvas) => void (await revealed(/^Coaching insights/)(canvas)),
});

/** MM-364: Settings' Coaching insights row opens its screen. */
export const SettingsOpensCoachingInsights = screenStory({
  covers: ['SettingsScreen', 'CoachSettingsScreen'],
  shows: 'Insights under logged items',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="coach" />),
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coaching insights/)(canvas));
  },
});

/** The design of every area, with the kinds drafted for those not built yet. */
const drafts = { kinds: draftInsightKinds };

/** MM-364: the master switch and the areas the app has kinds for, everything on. */
export const CoachSettings = screenStory({
  covers: ['CoachSettingsScreen'],
  shows: 'Insights under logged items',
  open: ({ navigator }) => void navigator.push(() => <CoachSettingsScreen />),
});

/** MM-364 (design): every area, as it will be once each has its kinds. */
export const CoachSettingsEveryArea = screenStory({
  covers: ['CoachSettingsScreen'],
  shows: 'Water',
  preview: drafts,
  open: ({ navigator }) => void navigator.push(() => <CoachSettingsScreen />),
});

/** MM-364: an area's row opens its kinds of insight. */
export const CoachSettingsOpensFood = screenStory({
  covers: ['CoachSettingsScreen', 'CoachAreaScreen'],
  shows: 'Kinds of insight',
  preview: drafts,
  open: ({ navigator }) => void navigator.push(() => <CoachSettingsScreen />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Food/ }));
  },
});

/** MM-364: everything off: each area says so and keeps its own position. */
export const CoachSettingsAllOff = screenStory({
  covers: ['CoachSettingsScreen'],
  shows: 'Off while insights are off',
  preview: drafts,
  open: ({ navigator }) => void navigator.push(() => <CoachSettingsScreen />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('switch', { name: /^Insights under logged items/ }));
  },
});

/** MM-364: food's kinds of insight, each with its switch and an example of its line. */
export const CoachSettingsFood = screenStory({
  covers: ['CoachAreaScreen'],
  shows: 'Kinds of insight',
  preview: drafts,
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="food" />),
});

/** MM-364: food switched off: its switch says the kinds wait. */
export const CoachSettingsFoodOff = screenStory({
  covers: ['CoachAreaScreen'],
  shows: /^Off\. The kinds below take effect/,
  preview: drafts,
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="food" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('switch', { name: /^Food insights/ }));
  },
});

/** MM-364 (the panel's UX-7, PD-8): an area opened while everything is off: its switch says so. */
export const CoachSettingsFoodWhileAllOff = screenStory({
  covers: ['CoachAreaScreen'],
  shows: /^Off while all insights are off/,
  preview: drafts,
  open: async ({ navigator, services }) => {
    await services.preferences.saveInsightSwitches(InsightSwitches.withAll(InsightSwitches.allOn, false));
    void navigator.push(() => <CoachAreaScreen area="food" />);
  },
});

/** MM-378: what is snoozed in an area, one for a time and one for always, each with the way back on. */
export const CoachSettingsFoodSnoozed = screenStory({
  covers: ['CoachAreaScreen'],
  shows: /^Garlic bread · until turned back on/,
  preview: drafts,
  open: async ({ navigator, services, today }) => {
    await services.insightSnoozes.saveInsightSnooze({ kind: 'mostlyFat', subject: 'Peanut butter', item: 'Peanut butter', resumesOn: today.addDays(8) });
    await services.insightSnoozes.saveInsightSnooze({ kind: 'portionCheck', subject: 'Garlic bread', item: 'Garlic bread', resumesOn: undefined });
    void navigator.push(() => <CoachAreaScreen area="food" />);
  },
});

/** MM-364: with an eating-disorder history, the kinds left out are listed without a switch. */
export const CoachSettingsFoodEatingDisorder = screenStory({
  covers: ['CoachAreaScreen'],
  shows: 'Not shown for your health answers.',
  preview: drafts,
  scenario: demoWith({ screening: { eatingDisorderHistory: true } }),
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="food" />),
});

/** MM-364: training's kinds, as the app has them. */
export const CoachSettingsTraining = screenStory({
  covers: ['CoachAreaScreen'],
  shows: 'Volume jump',
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="training" />),
});
