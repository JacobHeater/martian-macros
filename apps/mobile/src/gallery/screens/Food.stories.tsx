import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { showAddFoodSheet } from '../../food/showAddFoodSheet';
import { FoodEntry } from '../../domain/FoodEntry';
import type { UnitSystem } from '../../domain/UnitSystem';
import { WaterEntry } from '../../domain/water/WaterEntry';
import { WaterUnits } from '../../domain/water/WaterUnits';
import { demoWith } from './demoWith';
import { firstDayScenario } from './firstDayScenario';
import { screensMeta } from './screensMeta';
import { reveal } from './reveal';
import { screenStory } from './screenStory';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import { storyToday } from './storyToday';
import { valueOf } from './valueOf';

/**
 * The food log, and every step of adding to it. Before MM-255 (main at
 * 9fb8c79, 2026-10-13) the meals were four cards under a second macro
 * picture; after, the hero with the switch, the meals as sections with
 * their icons, method icons on the rows and the completeness row after the
 * last meal.
 */
const meta = { title: 'Screens/Food', ...screensMeta } satisfies Meta;
export default meta;

const addFood = ({ overlays, today }: StoryStage) => void showAddFoodSheet(overlays, today);

/**
 * Presses a button of the sheet, once it is there. A search result takes a
 * read of the food database to arrive, so this waits longer than a second.
 */
const press = (name: string | RegExp) => async (canvas: HTMLElement) =>
  userEvent.click(await within(canvas).findByRole('button', { name }, { timeout: 10000 }));

export const Food = screenStory({
  covers: ['FoodScreen'],
  shows: 'Breakfast',
  open: ({ state }) => state.homeTab.put('food'),
});

export const NothingLogged = screenStory({
  covers: ['FoodScreen'],
  shows: 'Add food',
  scenario: firstDayScenario,
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-268: an entry's menu is drawn by the overlay host, so the swipe row cannot clip it. */
export const EntryMenu = screenStory({
  covers: ['FoodScreen'],
  shows: 'Delete',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
  },
});

/** MM-302: an entry deleted; the Undo snack stands above the navigation bar and Add food rises above it. */
export const EntryRemoved = screenStory({
  covers: ['FoodScreen'],
  shows: 'Undo',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Delete' }));
  },
});

export const AddFood = screenStory({ covers: ['AddFoodSheet'], shows: 'Search foods', open: addFood });

/** MM-239: the search field with the keyboard in it shows one mark of focus, its box. */
export const AddFoodSearching = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Chicken breast, cooked',
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'chicken');
  },
});

export const AddFoodAmount = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Chicken breast, cooked',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'chicken breast, cooked' }),
  walk: press(/^Chicken breast, cooked/),
});

export const AddFoodManually = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Protein',
  open: addFood,
  walk: press('Enter manually'),
});

export const AddFoodScan = screenStory({
  covers: ['BarcodeScanStep'],
  shows: 'Scan a barcode',
  open: addFood,
  walk: press('Scan'),
});

export const AddFoodSaved = screenStory({
  covers: ['MyFoodsStep'],
  shows: 'My foods',
  open: addFood,
  walk: press('Saved'),
});

export const AddFoodEstimate = screenStory({
  covers: ['EstimateMealStep'],
  shows: 'Estimate a meal',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { estimateSize: 'regular' }),
});

export const EditFood = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Edit food',
  open: async ({ services, overlays, today }) => {
    const [entry] = await valueOf(services.food.watchFood(today));
    if (entry !== undefined) void showAddFoodSheet(overlays, today, { entry });
  },
});

/** Yesterday's food, opened on the Food screen, at Full detail with the Micros picture (MM-310). */
const yesterdaysFood = ({ state, today }: StoryStage) => {
  state.homeTab.put('food');
  state.selectedDay.put(today.addDays(-1));
};

/** MM-310: the nutrition card's third picture; the snack states fewer nutrients, so some rows say their coverage. */
export const Micros = screenStory({
  covers: ['FoodScreen'],
  shows: 'Also on the label',
  scenario: demoWith({ detail: 'full', picture: 'micros' }),
  open: yesterdaysFood,
});

/** MM-310: today so far, one food logged. */
export const MicrosToday = screenStory({
  covers: ['FoodScreen'],
  shows: 'Also on the label',
  scenario: demoWith({ detail: 'full', picture: 'micros' }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-310: nothing logged yet; no number is shown. */
export const MicrosEmpty = screenStory({
  covers: ['FoodScreen'],
  shows: 'Nothing logged yet. Start with breakfast.',
  scenario: async (repos, today) => {
    await firstDayScenario(repos, today);
    await repos.preferences.saveDetailLevel('full');
    await repos.preferences.saveMacroPicture('micros');
  },
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-310: pregnant, so no reference amounts, and the care-team line. */
export const MicrosCareTeam = screenStory({
  covers: ['FoodScreen'],
  shows: /ask your care team which apply/,
  scenario: demoWith({ detail: 'full', picture: 'micros', pregnant: true }),
  open: yesterdaysFood,
});

/** MM-311: a sodium limit of 1,200 mg, and a day over it by 200 mg. */
export const MicrosOverLimit = screenStory({
  covers: ['FoodScreen'],
  shows: /over your limit/,
  scenario: demoWith({ detail: 'full', picture: 'micros', sodiumLimitMg: 1200 }),
  open: yesterdaysFood,
});




/** A typed food with no sodium or micronutrients, added to yesterday. */
const typedSnack: StoryScenario = async (repos, today) => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today.addDays(-1),
      meal: 'snack',
      name: 'Granola bar',
      kcal: 190,
      proteinG: 4,
      carbsG: 29,
      fatG: 7,
      source: 'quickAdd',
    }),
  );
};

/** MM-311: under the limit, with a food that states no sodium, so the row says its coverage. */
export const MicrosUnderLimit = screenStory({
  covers: ['FoodScreen'],
  shows: /your limit/,
  scenario: demoWith({ detail: 'full', picture: 'micros', sodiumLimitMg: 2300, then: typedSnack }),
  open: yesterdaysFood,
});

/** MM-310: one food today stating only sodium, so most rows are stated by none. */
export const MicrosNotStated = screenStory({
  covers: ['FoodScreen'],
  shows: /Not stated by any food: /,
  scenario: async (repos, today) => {
    await firstDayScenario(repos, today);
    await repos.preferences.saveDetailLevel('full');
    await repos.preferences.saveMacroPicture('micros');
    await repos.food.addFood(
      new FoodEntry({
        id: 0,
        date: today,
        meal: 'breakfast',
        name: 'Instant oats',
        kcal: 150,
        proteinG: 5,
        carbsG: 27,
        fatG: 3,
        source: 'labelServing',
        sodiumMg: 110,
      }),
    );
  },
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-310: kidney disease, so no reference markers and the care-team line. */
export const MicrosKidney = screenStory({
  covers: ['FoodScreen'],
  shows: /With kidney disease/,
  scenario: demoWith({ detail: 'full', picture: 'micros', screening: { chronicKidneyDisease: true } }),
  open: yesterdaysFood,
});

/** MM-310: after bariatric surgery (the panel's MN-6), the surgical team's line. */
export const MicrosSurgery = screenStory({
  covers: ['FoodScreen'],
  shows: /After bariatric surgery/,
  scenario: demoWith({ detail: 'full', picture: 'micros', screening: { bariatricSurgery: true } }),
  open: yesterdaysFood,
});

/** MM-310: eighteen, so the adult reference bands do not apply. */
export const MicrosEighteen = screenStory({
  covers: ['FoodScreen'],
  shows: /different under 19/,
  scenario: demoWith({ detail: 'full', picture: 'micros', birthYear: storyToday.year - 18 }),
  open: yesterdaysFood,
});

/** Opens the Water section's "+", once the Food screen is there. */
const addWater = async (canvas: HTMLElement) => {
  const add = await within(canvas).findByRole('button', { name: 'Add water' });
  reveal(add);
  await userEvent.click(add);
};

/** MM-318: Water as a section like the meals, beside them, in imperial with no goal. */
export const WaterSection = screenStory({
  covers: ['FoodScreen'],
  shows: 'Water',
  open: yesterdaysFood,
  walk: async (canvas) => {
    reveal(await within(canvas).findByRole('button', { name: 'Add water' }));
  },
});

/** MM-318: no water yet and no goal: the header alone, as an empty meal. */
export const WaterNone = screenStory({
  covers: ['FoodScreen'],
  shows: 'Water',
  scenario: firstDayScenario,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByRole('button', { name: 'Add water' }));
  },
});

/** MM-313, MM-318: a goal of 1.5 L in metric, and a day past it. */
export const WaterGoalReached = screenStory({
  covers: ['FoodScreen'],
  shows: /Goal reached/,
  scenario: demoWith({ units: 'metric', waterGoalMl: 1500 }),
  open: yesterdaysFood,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/Goal reached/));
  },
});

/** MM-318: the header's "+" opens the Add water sheet, as a meal's opens Add food. */
export const WaterAddSheet = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'Other amount',
  open: yesterdaysFood,
  walk: addWater,
});

/** MM-318: the sheet in metric with another amount typed. */
export const WaterOtherAmount = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'Up to 3,000 ml at a time.',
  scenario: demoWith({ units: 'metric' }),
  open: yesterdaysFood,
  walk: async (canvas) => {
    await addWater(canvas);
    const body = canvas.ownerDocument.body;
    await userEvent.type(await within(body).findByRole('textbox', { name: 'Water, millilitres' }), '330');
  },
});

/** MM-318: imperial, nothing yet today, the sheet open. */
export const WaterOtherOpen = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'Up to 101 fl oz at a time.',
  scenario: firstDayScenario,
  open: ({ state }) => state.homeTab.put('food'),
  walk: addWater,
});

/** MM-318: another amount over the most one drink may be, refused with the range below. */
export const WaterOtherRefused = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'That is more than one drink can be.',
  scenario: demoWith({ units: 'metric' }),
  open: yesterdaysFood,
  walk: async (canvas) => {
    await addWater(canvas);
    const body = canvas.ownerDocument.body;
    await userEvent.type(await within(body).findByRole('textbox', { name: 'Water, millilitres' }), '5000');
    await userEvent.click(within(body).getByRole('button', { name: 'Save water' }));
  },
});

/** MM-318: a drink deleted from its "More actions", as a meal's food; the snack offers Undo. */
export const WaterRemoved = screenStory({
  covers: ['FoodScreen'],
  shows: /Removed .* of water/,
  open: yesterdaysFood,
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for .* of water/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Delete' }));
  },
});

/** MM-318 (the panel's PD-2): a goal of 2 L and nothing yet: the header says the goal alone. */
export const WaterGoalSetNone = screenStory({
  covers: ['FoodScreen'],
  shows: /Goal 2 L/,
  scenario: async (repos, today) => {
    await firstDayScenario(repos, today);
    await repos.setup.saveSetup((await repos.setup.loadSetup())!.copyWith({ unitSystem: 'metric' }));
    await repos.preferences.saveWaterGoal(2000);
  },
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/Goal 2 L/));
  },
});

/** MM-318 (the panel's PD-2): a goal of 2.5 L and part of it drunk. */
export const WaterGoalPartway = screenStory({
  covers: ['FoodScreen'],
  shows: /of 2.5 L/,
  scenario: demoWith({ units: 'metric', waterGoalMl: 2500 }),
  open: yesterdaysFood,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/of 2.5 L/));
  },
});

/** MM-318 (the panel's PD-1): a drink pressed opens Edit water, as a food opens Edit food. */
export const WaterEdit = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'Edit water',
  scenario: demoWith({ units: 'metric' }),
  open: yesterdaysFood,
  walk: async (canvas) => {
    const [drink] = await within(canvas).findAllByRole('button', { name: /^Edit .* of water/ });
    if (drink !== undefined) {
      reveal(drink);
      await userEvent.click(drink);
    }
  },
});

/**
 * MM-326: the first day in `units` with a water goal of `goalMl` and these
 * drinks today, an hour apart from 7 AM, on the Food screen.
 */
const waterToday =
  (units: UnitSystem, goalMl: number, drinksMl: readonly number[]): StoryScenario =>
  async (repos, today) => {
    await firstDayScenario(repos, today);
    await repos.setup.saveSetup((await repos.setup.loadSetup())!.copyWith({ unitSystem: units }));
    await repos.preferences.saveWaterGoal(goalMl);
    for (const [i, ml] of drinksMl.entries()) {
      const at = new Date(today.year, today.month - 1, today.day, 7 + i);
      await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml, at }));
    }
  };

const eightFlOz = WaterUnits.flOzToMl(8);

/** MM-326: a gallon's goal and three glasses: 3 of 16 glasses filled under the header. */
export const WaterGlasses = screenStory({
  covers: ['FoodScreen'],
  shows: /3 of 16 glasses/,
  scenario: waterToday('imperial', WaterUnits.flOzToMl(128), [eightFlOz, eightFlOz, eightFlOz]),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/3 of 16 glasses/));
  },
});

/** MM-326: the section folded: the drinks hide and the glasses stay. */
export const WaterGlassesFolded = screenStory({
  covers: ['FoodScreen'],
  shows: /3 of 16 glasses/,
  scenario: waterToday('imperial', WaterUnits.flOzToMl(128), [eightFlOz, eightFlOz, eightFlOz]),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const header = await within(canvas).findByRole('button', { name: /^Water/, expanded: true });
    await userEvent.click(header);
    reveal(await within(canvas).findByText(/3 of 16 glasses/));
  },
});

/** MM-326: 375 ml of a 2 L goal: one glass full and the next half. */
export const WaterGlassesHalf = screenStory({
  covers: ['FoodScreen'],
  shows: /1½ of 8 glasses/,
  scenario: waterToday('metric', 2000, [250, 125]),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/1½ of 8 glasses/));
  },
});

/** MM-326: the largest goal, 6 L in imperial: 26 glasses on rows of 9, 9 and 8. */
export const WaterMostGlasses = screenStory({
  covers: ['FoodScreen'],
  shows: /of 26 glasses/,
  scenario: waterToday('imperial', 6000, [WaterUnits.flOzToMl(16.9), WaterUnits.flOzToMl(16.9), eightFlOz]),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/of 26 glasses/));
  },
});
