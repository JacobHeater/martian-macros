import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import type { CalendarDate } from '../../domain/CalendarDate';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../domain/FoodEntry';
import { Exercise } from '../../domain/training/Exercise';
import { Workout } from '../../domain/training/Workout';
import { WorkoutExercise } from '../../domain/training/WorkoutExercise';
import { WorkoutSet } from '../../domain/training/WorkoutSet';
import { FixturePack } from '../../foodCatalog/FixturePack';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { LibraryScreen } from '../../library/LibraryScreen';
import { firstDayScenario } from './firstDayScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import { withOwnFoods } from './withOwnFoods';

/**
 * The Library (MM-706): everything the person made, in folds, with New food
 * above them; and the forms a food, a recipe or an exercise is made or
 * changed in, which open over it (moved here from the Saved step, MM-707).
 */
const meta = { title: 'Screens/Library', ...screensMeta } satisfies Meta;
export default meta;

const openLibrary = ({ navigator }: StoryStage) => void navigator.push(() => <LibraryScreen />);

const press = (name: string | RegExp) => async (canvas: HTMLElement) =>
  userEvent.click(await within(canvas).findByRole('button', { name }, { timeout: 10000 }));
const onBody = (canvas: HTMLElement) => within(canvas.ownerDocument.body);

/** Opens the editor of the saved food, recipe or exercise called `name` from its row's menu. */
const edit = (name: string) => async (canvas: HTMLElement) => {
  await press(`More actions for ${name}`)(canvas);
  await userEvent.click(await onBody(canvas).findByRole('menuitem', { name: 'Edit' }));
};

/** Presses New food, then the way called `route`. */
const newFoodBy = (route: RegExp) => async (canvas: HTMLElement) => {
  await press('New food')(canvas);
  await press(route)(canvas);
};

/** An entry logged from the saved food `foodId`, `daysAgo` days ago, with the food's numbers (MM-167's origin). */
const loggedFrom = (today: CalendarDate, food: CustomFood, foodId: number, daysAgo: number) =>
  new FoodEntry({
    id: 0,
    date: today.addDays(-daysAgo),
    meal: 'breakfast',
    name: food.name,
    kcal: food.perServing.kcal,
    proteinG: food.perServing.proteinG,
    carbsG: food.perServing.carbsG,
    fatG: food.perServing.fatG,
    source: 'householdMeasure',
    portion: { method: 'householdMeasure', basis: 'calculated', quantity: 1, unit: 'serving', origin: { packId: 'custom', foodId, source: 'user' } },
  });

/**
 * The demo with the person's own foods and recipe (MM-45), logged from on
 * several days, a yogurt named as the pack names it (the longest name the
 * data has), a saved meal, and an exercise of their own trained twice.
 */
const withLibrary: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  const overnight = new CustomFood({
    id: 0,
    name: 'Demo overnight oats',
    kind: 'food',
    servingDescription: '1 jar',
    servingGrams: 250,
    perServing: new NutritionTotals({ kcal: 410, proteinG: 24, carbsG: 52, fatG: 11 }),
  });
  const overnightId = await repos.customFoods.saveCustomFood(overnight);
  for (const daysAgo of [1, 3, 5, 8, 12]) await repos.food.addFood(loggedFrom(today, overnight, overnightId, daysAgo));
  const yogurt = new CustomFood({
    id: 0,
    name: 'Greek yogurt, plain nonfat',
    kind: 'food',
    servingDescription: '1 bowl with honey',
    servingGrams: 220,
    perServing: new NutritionTotals({ kcal: 310, proteinG: 22, carbsG: 34, fatG: 9 }),
    fiberG: 2,
    micros: new Micronutrients({ sodium: 85, sugars: 24, saturatedFat: 1.2, calcium: 230, potassium: 300 }),
  });
  const yogurtId = await repos.customFoods.saveCustomFood(yogurt);
  await repos.food.addFood(loggedFrom(today, yogurt, yogurtId, 2));
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Demo chili',
      kind: 'recipe',
      servingDescription: '1 bowl',
      servings: 4,
      perServing: new NutritionTotals({ kcal: 511, proteinG: 46, carbsG: 36, fatG: 20 }),
      ingredients: [
        { name: 'Ground beef, lean, cooked', grams: 500, totals: new NutritionTotals({ kcal: 1250, proteinG: 130, carbsG: 0, fatG: 75 }) },
        { name: 'Black beans, cooked', grams: 600, totals: new NutritionTotals({ kcal: 792, proteinG: 53, carbsG: 144, fatG: 3 }) },
      ],
    }),
  );
  await repos.savedMeals.saveMeal(
    'Demo usual breakfast',
    [
      new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Demo oats and yogurt', kcal: 420, proteinG: 28, carbsG: 55, fatG: 10, source: 'weighed' }),
      new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Demo coffee with milk', kcal: 40, proteinG: 2, carbsG: 3, fatG: 2, source: 'weighed' }),
    ],
    today,
  );
  const landmine = await repos.customExercises.saveCustomExercise(
    new Exercise({ id: '', name: 'Landmine press', equipment: 'barbell', primary: 'shoulders', secondary: ['chest', 'triceps'], load: 'addedWeight' }),
  );
  for (const daysAgo of [2, 6]) {
    const startedAt = new Date(2026, 9, 28 - daysAgo, 18, 0);
    await repos.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: today.addDays(-daysAgo),
        startedAt,
        endedAt: new Date(startedAt.getTime() + 45 * 60_000),
        exercises: [new WorkoutExercise({ exerciseId: landmine, sets: [new WorkoutSet({ reps: 8, loadKg: 40 }), new WorkoutSet({ reps: 8, loadKg: 40 })] })],
      }),
    );
  }
};

/** The way this branch reaches the Library (MM-707): Add food, Saved, "Manage in Library"; the sheet closes and the Library opens over Food. */
export const LibraryFromSaved = screenStory({
  covers: ['LibraryScreen', 'MyFoodsStep'],
  shows: 'Library',
  scenario: withLibrary,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await press('Add food to breakfast')(canvas);
    await press('Saved')(canvas);
    await press('Manage in Library')(canvas);
  },
});

export const Library = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Foods · 2',
  scenario: withLibrary,
  open: openLibrary,
});

/** Nothing made yet: each fold, opened, says in one line what fills it. */
export const LibraryEmpty = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Nothing saved yet. New food makes one.',
  scenario: firstDayScenario,
  open: openLibrary,
  walk: async (canvas) => {
    for (const fold of ['Foods', 'Recipes', 'Meals', 'Usual foods', 'Exercises']) await press(fold)(canvas);
  },
});

export const LibraryFoodsOpen = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Last logged yesterday · 5 times',
  scenario: withLibrary,
  open: openLibrary,
  walk: press('Foods · 2'),
});

/** At 360 px: the longest saved-food name the data has, with its grade, its menu and its two lines. */
export const LibraryFoodsOpenSmallPhone = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Last logged yesterday · 5 times',
  scenario: withLibrary,
  viewport: 'smallPhone',
  open: openLibrary,
  walk: press('Foods · 2'),
});

export const LibraryRecipesOpen = screenStory({
  covers: ['LibraryScreen'],
  shows: /Makes 4 servings/,
  scenario: withLibrary,
  open: openLibrary,
  walk: press('Recipes · 1'),
});

export const LibraryMealsOpen = screenStory({
  covers: ['LibraryScreen'],
  shows: /^2 foods · 460 kcal/,
  scenario: withLibrary,
  open: openLibrary,
  walk: press('Meals · 1'),
});

/** The foods the demo logs often, from the log, each with "Save as a food". */
export const LibraryUsualFoods = screenStory({
  covers: ['LibraryScreen'],
  shows: /^Logged \d+ times in the last 4 weeks/,
  scenario: withLibrary,
  open: openLibrary,
  walk: press('Usual foods'),
});

export const LibraryExercises = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Last trained 2 days ago · 2 workouts',
  scenario: withLibrary,
  open: openLibrary,
  walk: press('Exercises · 1'),
});

/** New food's chooser: a label, typing, or a recipe. */
export const LibraryNewFood = screenStory({
  covers: ['LibraryScreen', 'NewFoodSheet'],
  shows: /^With my AI/,
  scenario: withLibrary,
  open: openLibrary,
  walk: press('New food'),
});

/** With my AI from New food (MM-708): its screen pushed over the Library. */
export const LibraryWithMyAi = screenStory({
  covers: ['LibraryScreen', 'MakeFoodWithAiScreen'],
  shows: 'With my AI',
  scenario: withLibrary,
  open: openLibrary,
  walk: newFoodBy(/^With my AI/),
});

/** The form a food is typed into, opened from New food (moved from the Saved step, MM-707). */
export const NewOwnFood = screenStory({
  covers: ['LibraryScreen'],
  shows: 'One serving is',
  open: openLibrary,
  walk: newFoodBy(/^Type it in/),
});

/** Scan a label on a phone whose camera is not allowed: the read starts at once and says so; the numbers can be typed. */
export const ScanLabelNoCamera = screenStory({
  covers: ['LibraryScreen'],
  shows: /^The camera could not be used/,
  open: openLibrary,
  walk: newFoodBy(/^Scan a label/),
});

/**
 * MM-44: a label read from a panel whose labels and values came back in two columns: the numbers paired by
 * position, and each one marked unsure until it is changed.
 */
export const ScanLabelUnsure = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Numbers for one serving',
  device: (services) =>
    Promise.resolve({
      ...services,
      labelReader: {
        readLabel: () =>
          Promise.resolve(
            'Nutrition Facts\nServing size 1 bar (40g)\nCalories 180\nTotal Fat\nSodium\nTotal Carbohydrate\nProtein\n6g\n95mg\n24g\n8g',
          ),
      },
    }),
  open: openLibrary,
  walk: async (canvas) => {
    await newFoodBy(/^Scan a label/)(canvas);
    await onBody(canvas).findByText(/Numbers marked unsure were hard to read/);
  },
});

/** A usual food about to be saved as one of the person's own: the form filled from its latest entry. */
export const SaveUsualAsFood = screenStory({
  covers: ['LibraryScreen'],
  shows: 'One serving is the amount you logged last time. Change anything, then save it to log in any amount.',
  scenario: withLibrary,
  open: openLibrary,
  walk: async (canvas) => {
    await press('Usual foods')(canvas);
    await userEvent.click((await within(canvas).findAllByRole('button', { name: 'Save as a food' }))[0] as HTMLElement);
  },
});

/** A saved food opened to change, from its row. */
export const EditOwnFood = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Edit your food',
  scenario: withLibrary,
  open: openLibrary,
  walk: async (canvas) => {
    await press('Foods · 2')(canvas);
    await edit('Demo overnight oats')(canvas);
  },
});

/** An exercise of the person's own opened to change (MM-76, MM-706). */
export const EditOwnExercise = screenStory({
  covers: ['LibraryScreen', 'CustomExerciseScreen'],
  shows: 'Edit your exercise',
  scenario: withLibrary,
  open: openLibrary,
  walk: async (canvas) => {
    await press('Exercises · 1')(canvas);
    await edit('Landmine press')(canvas);
  },
});

/** MM-321: a recipe opened to change, its ingredients listed, one picked from the pack. */
export const EditRecipe = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Makes servings',
  scenario: withOwnFoods,
  open: openLibrary,
  walk: async (canvas) => {
    await press('Recipes · 1')(canvas);
    await edit('Demo chili')(canvas);
    await userEvent.type(await onBody(canvas).findByRole('textbox', { name: 'Search ingredients' }), 'rice');
    await press(/^White rice, cooked/)(canvas);
  },
});

/** MM-321: a new recipe's ingredient entered by its numbers. */
export const NewRecipeByNumbers = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Totals for the amount you put in the pot.',
  open: openLibrary,
  walk: async (canvas) => {
    await newFoodBy(/^New recipe/)(canvas);
    await press('Enter numbers instead')(canvas);
  },
});

/** MM-45, MM-151: an ingredient the pack has raw and cooked, weighed: what the weight means either way. */
export const NewRecipeIngredientWeighedAs = screenStory({
  covers: ['LibraryScreen'],
  shows: '200 g cooked is about 260 kcal. 200 g raw is about 730 kcal.',
  open: openLibrary,
  walk: async (canvas) => {
    await newFoodBy(/^New recipe/)(canvas);
    await userEvent.type(await onBody(canvas).findByRole('textbox', { name: 'Search ingredients' }), 'white rice');
    await press(/^White rice, cooked/)(canvas);
    await userEvent.type(await onBody(canvas).findByRole('textbox', { name: 'Weight g' }), '200');
  },
});

/** MM-45: a recipe's ingredient line opened: move it or remove it. */
export const EditRecipeLineMenu = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Move down',
  scenario: withOwnFoods,
  open: openLibrary,
  walk: async (canvas) => {
    await press('Recipes · 1')(canvas);
    await edit('Demo chili')(canvas);
    await press('More actions for Ground beef, lean, cooked')(canvas);
  },
});

/** MM-456: a recipe whose rice was found in the pack (`packId`), 200 g raw, and whose butter was typed. */
const withRiceBowl =
  (packId: string): StoryScenario =>
  async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.customFoods.saveCustomFood(
      new CustomFood({
        id: 0,
        name: 'Demo rice bowl',
        kind: 'recipe',
        servingDescription: '1 serving',
        servings: 2,
        perServing: new NutritionTotals({ kcal: 401, proteinG: 7, carbsG: 80, fatG: 4.7 }),
        ingredients: [
          {
            name: 'White rice, raw',
            grams: 200,
            totals: new NutritionTotals({ kcal: 730, proteinG: 14, carbsG: 160, fatG: 1.4 }),
            source: { packId, foodId: 3 },
          },
          { name: 'Butter', grams: 10, totals: new NutritionTotals({ kcal: 72, proteinG: 0, carbsG: 0, fatG: 8 }) },
        ],
      }),
    );
  };

const openRiceBowlLine = async (canvas: HTMLElement) => {
  await press('Recipes · 1')(canvas);
  await edit('Demo rice bowl')(canvas);
  await press('More actions for White rice, raw')(canvas);
};

/** MM-456: a found line's weight changed in place, worked out again from the food as installed. */
export const EditRecipeLineWeight = screenStory({
  covers: ['LibraryScreen'],
  shows: '200 g is about 730 kcal.',
  scenario: withRiceBowl(FixturePack.packId),
  open: openLibrary,
  walk: async (canvas) => {
    await openRiceBowlLine(canvas);
    await userEvent.click(await onBody(canvas).findByRole('menuitem', { name: 'Change weight' }));
  },
});

/** MM-456: a found line's new weight saved: the line reads it, and focus is back on that line's menu button. */
export const EditRecipeLineWeightSaved = screenStory({
  covers: ['LibraryScreen'],
  shows: '100 g · 365 kcal',
  scenario: withRiceBowl(FixturePack.packId),
  open: openLibrary,
  walk: async (canvas) => {
    await openRiceBowlLine(canvas);
    await userEvent.click(await onBody(canvas).findByRole('menuitem', { name: 'Change weight' }));
    const field = await onBody(canvas).findByRole('textbox', { name: 'Weight g for White rice, raw' }, { timeout: 10000 });
    await userEvent.clear(field);
    await userEvent.type(field, '100');
    await press('Save weight')(canvas);
  },
});

/** MM-456: a found line whose food is no longer installed keeps its totals, says so, and its menu offers no weight change. */
export const EditRecipeLineFoodGone = screenStory({
  covers: ['LibraryScreen'],
  shows: '200 g · 730 kcal · food not installed',
  scenario: withRiceBowl('a-pack-since-removed'),
  open: openLibrary,
  walk: openRiceBowlLine,
});

/** MM-456: an ingredient just added: focus back in the search, and "Added …" said politely. */
export const NewRecipeIngredientAdded = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Added White rice, cooked',
  open: openLibrary,
  walk: async (canvas) => {
    await newFoodBy(/^New recipe/)(canvas);
    await userEvent.type(await onBody(canvas).findByRole('textbox', { name: 'Search ingredients' }), 'white rice');
    await press(/^White rice, cooked/)(canvas);
    await userEvent.type(await onBody(canvas).findByRole('textbox', { name: 'Weight g' }), '200');
    await press('Add ingredient')(canvas);
  },
});
