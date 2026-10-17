import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import type { InlineInsightContent } from '../../coach/InlineInsightContent';
import type { InsightPreview } from '../../coach/InsightPreview';
import type { RecentInsight } from '../../coach/RecentInsight';
import { FoodEntry } from '../../domain/FoodEntry';
import type { Meal } from '../../domain/Meal';
import { WaterEntry } from '../../domain/water/WaterEntry';
import { DemoSeed } from '../../fixtures/DemoSeed';
import type { FoodGradeLetter } from '../../food/FoodGradeLetter';
import type { FoodGradeValue } from '../../food/FoodGradeValue';
import { showAddFoodSheet } from '../../food/showAddFoodSheet';
import { CoachAreaScreen } from '../../settings/CoachAreaScreen';
import { CoachSettingsScreen } from '../../settings/CoachSettingsScreen';
import { InsightSwitchesDraft } from '../../settings/InsightSwitchesDraft';
import { SettingsScreen } from '../../settings/SettingsScreen';
import { WorkoutScreen } from '../../train/WorkoutScreen';
import { demoWith } from './demoWith';
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

const graded = (letter: FoodGradeLetter): FoodGradeValue => ({ kind: 'graded', letter });

// ---- Food: the owner's example, a food high in fat, with the coach's line under it ----

const peanutButter: InlineInsightContent = {
  line: 'Most of this item’s calories come from fat (76%). A smaller portion or a leaner spread leaves more room for protein.',
  evidence: [
    ['Calories', '190 kcal'],
    ['From fat', '144 kcal (76%)'],
    ['Protein', '7 g'],
  ],
  area: 'food',
  rule: 'Mostly fat',
};

const pasta: InlineInsightContent = {
  line: '640 kcal with 14 g of protein. Adding a protein source here makes your minimum easier.',
  evidence: [
    ['Calories', '640 kcal'],
    ['Protein', '14 g (9% of calories)'],
    ['Your protein minimum', '140 g a day'],
  ],
  area: 'food',
  rule: 'Light on protein',
};

const garlicBread: InlineInsightContent = {
  line: 'About twice the usual serving (4 slices). Worth checking the amount is right.',
  evidence: [
    ['Logged', '4 slices, 350 kcal'],
    ['Usual serving', '2 slices'],
  ],
  area: 'food',
  rule: 'Large portion',
};

const soupReason =
  'It was entered by its totals, with no fiber or sugar value. The grade needs both, and a missing value is never counted as zero.';

const foodPreview: InsightPreview = {
  entryNotes: new Map([
    ['Peanut butter', peanutButter],
    ['Pasta with cream sauce', pasta],
    ['Garlic bread', garlicBread],
  ]),
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
const foodPreviewEatingDisorder: InsightPreview = { ...foodPreview, entryNotes: new Map([['Pasta with cream sauce', pasta]]) };

/** Yesterday's demo day with a lunch, a snack and a typed soup that the insights and grades are about. */
const extraFoods: StoryScenario = async (repos, today) => {
  const date = today.addDays(-1);
  const add = (meal: Meal, name: string, kcal: number, proteinG: number, carbsG: number, fatG: number, source: FoodEntry['source']) =>
    repos.food.addFood(new FoodEntry({ id: 0, date, meal, name, kcal, proteinG, carbsG, fatG, source }));
  await add('lunch', 'Pasta with cream sauce', 640, 14, 70, 32, 'weighed');
  await add('lunch', 'Garlic bread', 350, 8, 40, 17, 'labelServing');
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
  shows: /^Most of this item’s calories come from fat/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Most of this item/)(canvas)),
});

/** MM-365: lunch with two lines, one under each of its foods. */
export const FoodTwoInsightsInOneMeal = screenStory({
  covers: ['FoodScreen'],
  shows: /^About twice the usual serving/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: 640 kcal with 14 g/)(canvas)),
});

/** MM-362: the line opened: what it rests on, and the way to its switch. */
export const FoodInsightOpen = screenStory({
  covers: ['FoodScreen'],
  shows: 'The numbers behind this',
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: Most of this item/)(canvas));
    reveal(await within(canvas).findByRole('button', { name: 'Settings for “Mostly fat”' }));
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
    await userEvent.click(await revealed(/^Coach: Most of this item/)(canvas));
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Settings for “Mostly fat”' }));
  },
});

/** MM-370: a graded food pressed says what its grade means. */
export const FoodGradeMeaning = screenStory({
  covers: ['FoodScreen'],
  shows: /^A grade for the food itself, per 100 g/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('Peanut butter: grade C')(canvas));
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
    await userEvent.click(await revealed('This day: grade B minus')(canvas));
  },
});

/** MM-362, MM-370 (the panel's UX-4): the food log at 200% text, the line under Peanut butter in view. */
export const FoodLargeText = screenStory({
  covers: ['FoodScreen'],
  shows: /^Most of this item’s calories come from fat/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  textScale: 2,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Most of this item/)(canvas)),
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
    await userEvent.click(await revealed('Snacks: can’t be graded. Why?')(canvas));
  },
});

/** The panel's UX-4: the food log on a 320 px phone: the entry's calories, grade and More beside a narrow name. */
export const FoodNarrow = screenStory({
  covers: ['FoodScreen'],
  shows: /^Most of this item’s calories come from fat/,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  viewport: 'narrowPhone',
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: Most of this item/)(canvas)),
});

/** MM-370: a food that can't be graded: the question mark opens why. */
export const FoodGradeWhy = screenStory({
  covers: ['FoodScreen'],
  shows: soupReason,
  scenario: demoWith({ then: extraFoods }),
  preview: foodPreview,
  open: yesterdaysFood,
  walk: async (canvas) => {
    await userEvent.click(await revealed('Homemade soup: can’t be graded. Why?')(canvas));
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
    await userEvent.click(await revealed('Snacks: can’t be graded. Why?')(canvas));
  },
});

/** MM-362, MM-370: eating-disorder history: grades as for anyone, no line about fat, protein's line kept. */
export const FoodWithInsightsEatingDisorder = screenStory({
  covers: ['FoodScreen'],
  shows: /^640 kcal with 14 g of protein/,
  scenario: demoWith({ screening: { eatingDisorderHistory: true }, then: extraFoods }),
  preview: foodPreviewEatingDisorder,
  open: yesterdaysFood,
  walk: async (canvas) => void (await revealed(/^Coach: 640 kcal with 14 g/)(canvas)),
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
  },
});

/** MM-370: the amount step says the grade in words beside its letter. */
export const AmountStepWithGrade = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Grade for the food itself, per 100 g',
  preview: { gradeOfFood },
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'chicken breast, cooked' }),
  walk: async (canvas) => {
    // The row, not its grade beside it ("Chicken breast, cooked: grade A").
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Chicken breast, cooked(?!: grade)/ }, { timeout: 10000 }));
  },
});

// ---- Training: a set and an exercise ----

/** The demo's lateral raise is the same 20 × 8 kg every week, so "holding steady" is what its history shows. */
const lateralRaise: InlineInsightContent = {
  line: 'About the same in your last 4 sessions. A small step up in reps or load is a common next step.',
  evidence: [
    ['Last 4 sessions', '20 × 17.6 lb each time'],
    ['Change in estimated best', 'none'],
  ],
  area: 'training',
  rule: 'Holding steady',
};

const workoutPreview: InsightPreview = { exerciseNotes: new Map([['dumbbell-lateral-raise', lateralRaise]]) };

const lastWorkout = async (stage: StoryStage) => {
  const workout = (await valueOf(stage.services.workouts.watchWorkouts()))[0];
  if (workout !== undefined) void stage.navigator.push(() => <WorkoutScreen workoutId={workout.id} />);
};

/**
 * MM-366: a line under the lateral raise, the last exercise. A new best is
 * not an inline line: the workout's Personal records card already says it.
 */
export const WorkoutWithInsights = screenStory({
  covers: ['WorkoutScreen'],
  shows: /^About the same in your last 4 sessions/,
  preview: workoutPreview,
  open: lastWorkout,
  walk: async (canvas) => void (await revealed(/^Coach: About the same in your last 4 sessions/)(canvas)),
});

/** MM-366: the line opened. */
export const WorkoutInsightOpen = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Change in estimated best',
  preview: workoutPreview,
  open: lastWorkout,
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coach: About the same in your last 4 sessions/)(canvas));
  },
});

// ---- The Dashboard: the weigh-in, the waist and water ----

/** The demo with water on 5 of the last 14 days, so the water line says what the data shows. */
const fewWaterDays: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace({ ...repos, water: undefined });
  for (const daysAgo of [0, 2, 5, 9, 12]) {
    const date = today.addDays(-daysAgo);
    await repos.water.addWater(new WaterEntry({ id: 0, date, ml: 500, at: new Date(date.year, date.month - 1, date.day, 9) }));
  }
};

const dashboardPreview: InsightPreview = {
  rowNotes: new Map([
    [
      'weight',
      {
        line: 'Weighed later than usual. Weighing at the same time each day makes the trend steadier.',
        evidence: [
          ['Today', '11:40 AM'],
          ['Usually', 'about 7:00 AM'],
          ['Weigh-ins it rests on', '14 in the last 14 days'],
        ],
        area: 'body',
        rule: 'Unusual weigh-in time',
      },
    ],
    [
      'waist',
      {
        line: 'Within the usual day-to-day difference of a tape, so not a change yet.',
        evidence: [
          ['Today', '35.8 in'],
          ['A week ago', '35.9 in'],
          ['A tape’s usual difference', 'about 0.4 in'],
        ],
        area: 'body',
        rule: 'Within the noise',
      },
    ],
    [
      'water',
      {
        line: 'Water logged on 5 of the last 14 days. A glass with each meal is an easy habit to log.',
        evidence: [
          ['Days with water', '5 of 14'],
          ['Your goal', 'on'],
        ],
        area: 'water',
        rule: 'Water on few days',
      },
    ],
  ]),
};

/** MM-367: a line under each of the three rows, inside their list group. */
export const DashboardWithInsights = screenStory({
  covers: ['DashboardScreen'],
  shows: /^Weighed later than usual/,
  scenario: fewWaterDays,
  preview: dashboardPreview,
  walk: async (canvas) => void (await revealed(/^Coach: Within the usual day-to-day difference/)(canvas)),
});

/** The panel's UX-4: the same rows at 200% text. */
export const DashboardLargeText = screenStory({
  covers: ['DashboardScreen'],
  shows: /^Weighed later than usual/,
  scenario: fewWaterDays,
  preview: dashboardPreview,
  textScale: 2,
  walk: async (canvas) => void (await revealed(/^Coach: Weighed later than usual/)(canvas)),
});

// ---- The Coach tab: what was said inline ----

const recent: readonly RecentInsight[] = [
  { area: 'food', item: 'Peanut butter, snack', day: storyToday.addDays(-1), line: peanutButter.line },
  { area: 'food', item: 'Pasta with cream sauce, lunch', day: storyToday.addDays(-1), line: pasta.line },
  { area: 'food', item: 'Granola bar, snack', day: storyToday.addDays(-6), line: garlicBread.line.replace('4 slices', '2 bars'), changed: true },
  { area: 'training', item: 'Dumbbell lateral raise', day: storyToday, line: lateralRaise.line },
  { area: 'body', item: 'Weigh-in', day: storyToday, line: 'Weighed later than usual. Weighing at the same time each day makes the trend steadier.' },
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
  preview: { coachSettings: true },
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => void (await revealed(/^Coaching insights/)(canvas)),
});

/** MM-364: Settings' Coaching insights row opens its screen. */
export const SettingsOpensCoachingInsights = screenStory({
  covers: ['SettingsScreen', 'CoachSettingsScreen'],
  shows: 'Insights under logged items',
  preview: { coachSettings: true },
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => {
    await userEvent.click(await revealed(/^Coaching insights/)(canvas));
  },
});

/** MM-364: the master switch and the areas, everything on. */
export const CoachSettings = screenStory({
  covers: ['CoachSettingsScreen'],
  shows: 'Insights under logged items',
  open: ({ navigator }) => void navigator.push(() => <CoachSettingsScreen />),
});

/** MM-364: an area's row opens its kinds of insight. */
export const CoachSettingsOpensFood = screenStory({
  covers: ['CoachSettingsScreen', 'CoachAreaScreen'],
  shows: 'Kinds of insight',
  open: ({ navigator }) => void navigator.push(() => <CoachSettingsScreen />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Food/ }));
  },
});

/** MM-364: everything off: each area says so and keeps its own position. */
export const CoachSettingsAllOff = screenStory({
  covers: ['CoachSettingsScreen'],
  shows: 'Off while insights are off',
  open: ({ navigator }) => void navigator.push(() => <CoachSettingsScreen />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('switch', { name: /^Insights under logged items/ }));
  },
});

/** MM-364: food's kinds of insight, each with its switch and an example of its line. */
export const CoachSettingsFood = screenStory({
  covers: ['CoachAreaScreen'],
  shows: 'Kinds of insight',
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="food" />),
});

/** MM-364: food switched off: its switch says the kinds wait. */
export const CoachSettingsFoodOff = screenStory({
  covers: ['CoachAreaScreen'],
  shows: /^Off\. The kinds below take effect/,
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="food" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('switch', { name: /^Food insights/ }));
  },
});

/** Every insight switched off, for the story of an area opened in that state. */
const allOff = () => {
  const draft = new InsightSwitchesDraft();
  draft.setAll(false);
  return draft;
};

/** MM-364 (the panel's UX-7, PD-8): an area opened while everything is off: its switch says so. */
export const CoachSettingsFoodWhileAllOff = screenStory({
  covers: ['CoachAreaScreen'],
  shows: /^Off while all insights are off/,
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="food" draft={allOff()} />),
});

/** MM-364: with an eating-disorder history, the kinds left out are listed without a switch. */
export const CoachSettingsFoodEatingDisorder = screenStory({
  covers: ['CoachAreaScreen'],
  shows: 'Not shown for your health answers.',
  scenario: demoWith({ screening: { eatingDisorderHistory: true } }),
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="food" />),
});

/** MM-364: training's rules. */
export const CoachSettingsTraining = screenStory({
  covers: ['CoachAreaScreen'],
  shows: 'Holding steady',
  open: ({ navigator }) => void navigator.push(() => <CoachAreaScreen area="training" />),
});
