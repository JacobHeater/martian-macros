import type { Meta } from '@storybook/react-vite';
import { expect, fireEvent, screen, userEvent, waitFor, within } from 'storybook/test';
import { showAddFoodSheet } from '../../food/showAddFoodSheet';
import { showSaveMealSheet } from '../../food/meal/showSaveMealSheet';
import { showEasyToMissSheet } from '../../food/showEasyToMissSheet';
import { FoodEntry } from '../../domain/FoodEntry';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import { FixturePack } from '../../foodCatalog/FixturePack';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { WaterEntry } from '../../domain/water/WaterEntry';
import { WaterUnits } from '../../domain/water/WaterUnits';
import { demoWith } from './demoWith';
import { failingRead } from './failingRead';
import { failingWrite } from './failingWrite';
import { firstDayScenario } from './firstDayScenario';
import { onTargetScenario } from './onTargetScenario';
import { runningTotalScenario } from './runningTotalScenario';
import { onlineFoods } from './onlineFoods';
import { storyPackHost } from './storyPackHost';
import type { FoodCatalog } from '../../foodCatalog/FoodCatalog';
import { constant } from '../../lang/constant';
import { screensMeta } from './screensMeta';
import { reveal } from './reveal';
import { screenStory } from './screenStory';
import { lightBreakfastScenario } from './lightBreakfastScenario';
import { writingCoach } from './writingCoach';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import { storyToday } from './storyToday';
import { valueOf } from './valueOf';
import { waitingRead } from './waitingRead';
import { weightLossMedicationScenario } from './weightLossMedicationScenario';
import { withOwnFoods } from './withOwnFoods';

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

/** MM-91: Food on a 360 px phone: the hero's macro rows, the meals' headers with their actions, an entry's method, grade and More inside the width. */
export const FoodSmallPhone = screenStory({
  covers: ['FoodScreen'],
  shows: 'Breakfast',
  open: ({ state }) => state.homeTab.put('food'),
  viewport: 'smallPhone',
});

/** MM-91: Food at 200% text: the day's heading and stepper, the meal headers with their "+" and the entries wrap. */
export const FoodLargeText = screenStory({
  covers: ['FoodScreen'],
  shows: 'Breakfast',
  open: ({ state }) => state.homeTab.put('food'),
  textScale: 2,
});

export const NothingLogged = screenStory({
  covers: ['FoodScreen'],
  shows: 'Breakfast',
  scenario: firstDayScenario,
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-123: a day inside the band, the larger of 5% and 100 kcal either side: the arc shows the zone and the caption says on target. */
export const FoodOnTarget = screenStory({
  covers: ['FoodScreen'],
  shows: /left of 2,[0-9]{3} · on target/,
  scenario: onTargetScenario,
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

/** MM-302: an entry deleted; the Undo snack stands above the safe area (no bar since MM-711). */
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

/** MM-597: a slot's menu opens the macro split of everything in it. */
export const MealSplit = screenStory({
  covers: ['FoodScreen', 'MealSplitSheet'],
  shows: 'Macro split',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [options] = await within(canvas).findAllByRole('button', { name: /^Options for/ });
    if (options !== undefined) await userEvent.click(options);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Macro split' }));
  },
});

/** MM-666: a slot's menu opens the coach breakdown of the meal's tactical impact, outlier and swap. */
export const MealCoachBreakdown = screenStory({
  covers: ['FoodScreen', 'MealBreakdownSheet'],
  shows: 'Meal impact',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [options] = await within(canvas).findAllByRole('button', { name: /^Options for/ });
    if (options !== undefined) await userEvent.click(options);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Coach breakdown' }));
  },
});

/** MM-713: the owner's breakfast, 243 kcal for 5 g, is fine: no drag row, no move row, and the coach says so and where the protein comes from. */
export const MealCoachBreakdownFine = screenStory({
  covers: ['FoodScreen', 'MealBreakdownSheet'],
  shows: /Nothing to fix here/,
  scenario: lightBreakfastScenario,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [options] = await within(canvas).findAllByRole('button', { name: /^Options for/ });
    if (options !== undefined) await userEvent.click(options);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Coach breakdown' }));
  },
});

/** MM-673: the breakdown with a BYOK coach writing: the wait where its words will stand, the rows under it as ever. */
export const MealCoachBreakdownWriting = screenStory({
  covers: ['FoodScreen', 'MealBreakdownSheet'],
  shows: 'The coach is writing…',
  device: writingCoach,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [options] = await within(canvas).findAllByRole('button', { name: /^Options for/ });
    if (options !== undefined) await userEvent.click(options);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Coach breakdown' }));
  },
});

/** MM-686: the model writing past three seconds: "Answer now" under the wait, at phone width, the built-in words at a press. */
export const MealCoachBreakdownAnswerNow = screenStory({
  covers: ['FoodScreen', 'MealBreakdownSheet'],
  shows: 'Answer now',
  device: writingCoach,
  viewport: 'smallPhone',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [options] = await within(canvas).findAllByRole('button', { name: /^Options for/ });
    if (options !== undefined) await userEvent.click(options);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Coach breakdown' }));
    await within(canvas.ownerDocument.body).findByRole('button', { name: 'Answer now' }, { timeout: 5000 });
  },
});

/** MM-675: the breakdown on a 360 px phone, scrolled: the grip and Close stay at the top while the words pass under. */
export const MealCoachBreakdownScrolled = screenStory({
  covers: ['FoodScreen', 'MealBreakdownSheet'],
  shows: 'Meal impact',
  viewport: 'smallPhone',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [options] = await within(canvas).findAllByRole('button', { name: /^Options for/ });
    if (options !== undefined) await userEvent.click(options);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Coach breakdown' }));
    const sheet = await within(canvas.ownerDocument.body).findByRole('dialog');
    await within(sheet).findByText('Meal impact');
    sheet.scrollTop = 400;
  },
});

/** MM-634: choosing foods of the day to change together: each row a box to tick, the bar at the foot of the list. */
export const FoodChoosing = screenStory({
  covers: ['FoodScreen'],
  shows: /chosen$/,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Select' }));
  },
});

/** MM-661 (the owner): a long press on a food starts choosing with it ticked, one tap under the finger. */
export const FoodChoosingByLongPress = screenStory({
  covers: ['FoodScreen'],
  shows: /chosen$/,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [row] = await within(canvas).findAllByRole('button', { name: /^Edit / });
    if (row === undefined) return;
    const at = { clientX: 100, clientY: 100, pointerId: 1 };
    fireEvent.pointerDown(row, at);
    await new Promise((resolve) => setTimeout(resolve, 650));
    fireEvent.pointerUp(row, at);
  },
});

/** MM-634's follow-up (UX-2): choosing at 200% text: the boxes wrap and the bar at the foot keeps its action in reach. */
export const FoodChoosingLargeText = screenStory({
  covers: ['FoodScreen'],
  shows: /chosen$/,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Select' }));
  },
  textScale: 2,
});

/** MM-634: choosing with nothing chosen: the bar asks for foods, and its action is off. */
export const FoodChoosingNone = screenStory({
  covers: ['FoodScreen'],
  shows: 'Choose foods to change together',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Select' }));
    const [ticked] = await within(canvas).findAllByRole('checkbox', { checked: true });
    if (ticked !== undefined) await userEvent.click(ticked);
  },
});

/** MM-714 (the owner): a food's ⋯ menu offers what the chosen foods' dialog does, Copy to another meal among them. */
export const FoodEntryMenu = screenStory({
  covers: ['FoodScreen'],
  shows: 'Copy to another meal',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
  },
});

/** MM-714: the food's menu, all seven items, on a 360 px phone. */
export const FoodEntryMenuSmallPhone = screenStory({
  covers: ['FoodScreen'],
  shows: 'Copy to another meal',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
  },
  viewport: 'smallPhone',
});

/** MM-714: the chosen foods' dialog, the same six items as a food's menu. */
export const FoodChoosingActions = screenStory({
  covers: ['FoodScreen'],
  shows: 'Copy to another meal',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('menuitem', { name: 'Select' }));
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Change 1 food/ }));
  },
});

/** MM-630: a meal's menu: its macro split, and one time, meal or day for all its foods. */
export const FoodMealMenu = screenStory({
  covers: ['FoodScreen'],
  shows: 'Move to another day',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [options] = await within(canvas).findAllByRole('button', { name: /^Options for/ });
    if (options !== undefined) await userEvent.click(options);
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
    // The demo's log matches too, so their own come first (MM-652); the database's are a press away.
    await press('Database')(canvas);
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

/** MM-570: a food typed for today starts at the time it is now, and the row opens the clock to change it. */
export const AddFoodTimeEaten = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Time eaten',
  open: addFood,
  walk: async (canvas) => {
    await press('Enter manually')(canvas);
    await press(/^Time eaten/)(canvas);
  },
});

/** MM-570: an entry logged before times were kept says its time eaten is not set, and nothing is invented. */
export const EditFoodTimeNotSet = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Not set',
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

/** MM-561: a nutrient's row opened to the foods that add the most of it, most first. */
export const MicrosTopFoods = screenStory({
  covers: ['FoodScreen'],
  shows: 'Also on the label',
  scenario: demoWith({ detail: 'full', picture: 'micros' }),
  open: yesterdaysFood,
  walk: press(/^Sodium/),
});

/** MM-562: a macro pressed in the Grams picture: its top five foods, each with its meal as a chip. */
export const MacroTopFoods = screenStory({
  covers: ['FoodScreen'],
  shows: 'Breakfast',
  open: yesterdaysFood,
  walk: press(/^Protein/),
});

/** MM-562: the same from the split's legend; the ring has no caption under it. */
export const SplitTopFoods = screenStory({
  covers: ['FoodScreen'],
  shows: 'Breakfast',
  scenario: demoWith({ detail: 'standard', picture: 'donut' }),
  open: yesterdaysFood,
  walk: press(/^Fat/),
});

/** MM-310: today so far, one food logged. */
export const MicrosToday = screenStory({
  covers: ['FoodScreen'],
  shows: 'Also on the label',
  scenario: demoWith({ detail: 'full', picture: 'micros' }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-310: nothing logged yet; no number is shown, and no line says so (MM-389). */
export const MicrosEmpty = screenStory({
  covers: ['FoodScreen'],
  shows: 'Micros',
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

/** MM-313, MM-318: a day past the goal suggested for the demo person (MM-357): a bottle more than the demo's day. */
export const WaterGoalReached = screenStory({
  covers: ['FoodScreen'],
  shows: /Goal reached/,
  scenario: demoWith({
    then: async (repos, today) => {
      const yesterday = today.addDays(-1);
      await repos.water.addWater(new WaterEntry({ id: 0, date: yesterday, ml: 1500, at: new Date(yesterday.year, yesterday.month - 1, yesterday.day, 21) }));
    },
  }),
  open: yesterdaysFood,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/Goal reached/));
    // The ripple comes two frames after the bar (MM-326): waited for, so it is drawn on every runner.
    await waitFor(() => expect(canvas.querySelector('.mm-progress-wave')).not.toBeNull());
  },
});

/** MM-318: the header's "+" opens the Add water sheet, as a meal's opens Add food. */
export const WaterAddSheet = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'Other amount',
  open: yesterdaysFood,
  walk: addWater,
});

/** MM-318: the sheet in metric with another amount typed; the one water story about units (MM-357). */
export const WaterOtherAmount = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'Up to 3,000 ml at a time.',
  scenario: demoWith({ units: 'metric' }),
  about: ['units'],
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
  open: yesterdaysFood,
  walk: async (canvas) => {
    await addWater(canvas);
    const body = canvas.ownerDocument.body;
    await userEvent.type(await within(body).findByRole('textbox', { name: 'Water, fluid ounces' }), '170');
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

/** MM-318 (the panel's PD-2): the first day, the goal suggested and nothing yet: the header says the goal alone. */
export const WaterGoalSetNone = screenStory({
  covers: ['FoodScreen'],
  shows: /^Goal \d+ fl oz/,
  scenario: firstDayScenario,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/^Goal \d+ fl oz/));
  },
});

/** MM-318 (the panel's PD-2): the demo person's goal and part of it drunk. */
export const WaterGoalPartway = screenStory({
  covers: ['FoodScreen'],
  shows: /fl oz of \d+ fl oz/,
  open: yesterdaysFood,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/fl oz of \d+ fl oz/));
  },
});

/** MM-318 (the panel's PD-1): a drink pressed opens Edit water, as a food opens Edit food. */
export const WaterEdit = screenStory({
  covers: ['AddWaterSheet'],
  shows: 'Edit water',
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
 * MM-326: the first day with the goal suggested for the person (96 fl oz,
 * 12 glasses, from the day's own targets; MM-357) and these drinks today,
 * an hour apart from 7 AM, on the Food screen.
 */
const waterToday =
  (drinksMl: readonly number[]): StoryScenario =>
  async (repos, today) => {
    await firstDayScenario(repos, today);
    for (const [i, ml] of drinksMl.entries()) {
      const at = new Date(today.year, today.month - 1, today.day, 7 + i);
      await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml, at }));
    }
  };

const eightFlOz = WaterUnits.flOzToMl(8);

/** MM-326: three glasses of the twelve suggested: the water poured a little way into its bar. */
export const WaterBar = screenStory({
  covers: ['FoodScreen'],
  shows: /3 of 12 glasses/,
  scenario: waterToday([eightFlOz, eightFlOz, eightFlOz]),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/3 of 12 glasses/));
  },
});

/** MM-326: the section folded: the drinks hide and the bar stays. */
export const WaterBarFolded = screenStory({
  covers: ['FoodScreen'],
  shows: /3 of 12 glasses/,
  scenario: waterToday([eightFlOz, eightFlOz, eightFlOz]),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const header = await within(canvas).findByRole('button', { name: /^Water/, expanded: true });
    await userEvent.click(header);
    reveal(await within(canvas).findByText(/3 of 12 glasses/));
  },
});

/** MM-326: most of the suggested goal, beside the meals. */
export const WaterBarNearlyThere = screenStory({
  covers: ['FoodScreen'],
  shows: /11 of 12 glasses/,
  scenario: waterToday([eightFlOz * 2, eightFlOz * 2, eightFlOz * 2, eightFlOz * 2, eightFlOz * 2, eightFlOz]),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/11 of 12 glasses/));
  },
});

// ---- MM-321: the Food screen's states no story drew ----

/** The sheet's controls, which sit on the document's body, outside the canvas. */
const inSheet = (canvas: HTMLElement) => within(canvas.ownerDocument.body);

/** Opens Add food, presses Enter manually, then the measuring method `method`. */
const manuallyAs = (method: string) => async (canvas: HTMLElement) => {
  await press('Enter manually')(canvas);
  const methods = await inSheet(canvas).findByRole('group', { name: 'How was it measured?' });
  await userEvent.click(within(methods).getByRole('button', { name: method }));
};

/** MM-321: entered by hand, weighed: grams or ounces to choose. */
export const AddFoodWeighed = screenStory({ covers: ['AddFoodSheet'], shows: 'Protein', open: addFood, walk: manuallyAs('Weighed') });

/** MM-321: entered by hand as an estimate: totals only, no amount. */
export const AddFoodEstimatedTotals = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Calories',
  open: addFood,
  walk: manuallyAs('Estimated totals'),
});

/** MM-321, MM-596: a search that matches the person's own food and one from their log, above the pack's. */
export const AddFoodOwnAndRecent = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^From your log/,
  scenario: withOwnFoods,
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'demo');
  },
});

/** MM-410: a search with more than a page of results ends in "More results". */
export const AddFoodMoreResults = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'More results',
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'yogurt');
    // The demo's log matches too, so their own come first (MM-652); the database's are a press away.
    await press('Database')(canvas);
  },
});

/** MM-410: after "More results", every match is listed and the button is gone. */
export const AddFoodMoreResultsShown = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Greek yogurt, plain nonfat',
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'yogurt');
    await press('Database')(canvas);
    await userEvent.click(await within(canvas).findByRole('button', { name: 'More results' }, { timeout: 10000 }));
    await waitFor(() => expect(within(canvas).queryByRole('button', { name: 'More results' })).toBeNull(), { timeout: 10000 });
  },
});

/** MM-411: the food database could not be read; the search says so, with a way to try again, never "Nothing found". */
export const AddFoodSearchFailed = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Could not read the food database',
  device: async (services) => {
    const failing = Object.create(await valueOf(services.catalog)) as FoodCatalog;
    Object.defineProperty(failing, 'search', { value: () => Promise.reject(new Error('disk I/O error')) });
    return { ...services, catalog: constant(failing) };
  },
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'oats');
    await press('Database')(canvas);
  },
});

/** MM-218: the typed form with its numbers in, two servings, and calories typed against the macros: what it logs, and which figure is kept. */
export const AddFoodManuallyTwoServings = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Logs 800 kcal/,
  open: addFood,
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Enter manually' }, { timeout: 10000 }));
    const sheet = within(canvas);
    await userEvent.type(sheet.getByRole('textbox', { name: 'Food name' }), 'Granola');
    const servings = sheet.getByRole('textbox', { name: 'Servings eaten' });
    await userEvent.clear(servings);
    await userEvent.type(servings, '2');
    await userEvent.type(sheet.getByRole('textbox', { name: 'Protein g' }), '20');
    await userEvent.type(sheet.getByRole('textbox', { name: 'Carbs g' }), '30');
    await userEvent.type(sheet.getByRole('textbox', { name: 'Fat g' }), '10');
    await userEvent.type(sheet.getByRole('textbox', { name: /^Calories/ }), '400');
  },
});

/** MM-221: an entry calculated from a label serving: the numbers it rests on, and the day control that moves it. */
export const EditFoodPerServing = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Per serving: /,
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({
        id: 0,
        date: today,
        meal: 'snack',
        name: 'Protein bar',
        kcal: 398,
        proteinG: 40,
        carbsG: 30,
        fatG: 12,
        source: 'labelServing',
        portion: {
          method: 'labelServing',
          basis: 'calculated',
          quantity: 2,
          unit: 'serving',
          reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 199, proteinG: 20, carbsG: 15, fatG: 6 }), servingUnit: 'serving' },
        },
      }),
    );
  },
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Edit Protein bar' }, { timeout: 10000 }));
  },
});

/** MM-221: the entry moved to yesterday: the snack says where it went. */
export const EditFoodMoved = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Moved to Yesterday.',
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today, meal: 'snack', name: 'Protein bar', kcal: 398, proteinG: 40, carbsG: 30, fatG: 12, source: 'labelServing' }),
    );
  },
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Edit Protein bar' }, { timeout: 10000 }));
    const sheet = await screen.findByRole('dialog', { name: 'Edit food' }, { timeout: 10000 });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Previous day' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save changes' }));
  },
});

/** MM-218: a hand portion of a found food logs an estimate, and the line says so. */
export const AddFoodAmountHand = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Logs an estimate: /,
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'chicken');
    await press('Database')(canvas);
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Chicken breast, cooked/ }, { timeout: 10000 }));
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Palm/ }, { timeout: 10000 }));
    const amount = await within(canvas).findByRole('textbox', { name: /^(How many|Amount)/ });
    await userEvent.clear(amount);
    await userEvent.type(amount, '2');
  },
});

/** MM-321: a search that finds nothing. */
export const AddFoodNothingFound = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Nothing found for/,
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'zzqx');
  },
});

/** MM-627: a search whose every word finds nothing: the closest foods, said as such, with each row's serving. */
export const AddFoodSearchClosest = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^No exact match for/,
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'chicken breast skinless');
    await press('Database')(canvas);
  },
});

/** MM-321: a food from the pack, logged and opened again: the amount drives the totals. */
export const EditFoodFromThePack = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Logs \d/,
  open: ({ state, overlays, today }) => {
    state.homeTab.put('food');
    void showAddFoodSheet(overlays, today, { initialQuery: 'chicken breast, cooked' });
  },
  walk: async (canvas) => {
    await press(/^Chicken breast, cooked/)(canvas);
    await userEvent.click(await inSheet(canvas).findByRole('button', { name: 'Log it' }));
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Edit Chicken breast, cooked' }));
  },
});

/** MM-321: a packaged food from the pack: its brand under its name. */
export const AddFoodAmountBranded = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Test Brand',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'protein bar' }),
  walk: press(/^Protein bar, chocolate/),
});

/** MM-321: a food the pack has raw and cooked: what the weight means either way. */
export const AddFoodAmountRawOrCooked = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Weighed as',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'white rice, raw' }),
  walk: press(/^White rice, raw/),
});

/** MM-321: a gram of cola, which a label would round to nothing. */
export const AddFoodAmountRoundsToZero = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Labels may round small servings to zero. Many servings add up.',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'cola' }),
  walk: async (canvas) => {
    // The fixture's cola, not the stories' per-100 mL one (MM-651).
    await press(/^Cola · Test Brand/)(canvas);
    const amount = await inSheet(canvas).findByRole('textbox', { name: /^Amount/ });
    await userEvent.clear(amount);
    await userEvent.type(amount, '1');
  },
});

/** MM-396: net carbs switched off: the bars say Carbs, the total. */
export const FoodTotalCarbs = screenStory({
  covers: ['FoodScreen'],
  shows: 'Carbs',
  scenario: demoWith({ then: async (repos) => repos.preferences.saveNetCarbs(false) }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-321: "Is this day fully logged?" pressed: the three answers. */
export const DayCompleteness = screenStory({
  covers: ['FoodScreen'],
  shows: 'Not marked',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /(Counted unless it looks unfinished|Counted as a whole day|Left out of your metabolism estimate)/ }));
  },
});

/** MM-692: today marked complete: the positive chip at the hero's top right, above what is left. */
export const DayComplete = screenStory({
  covers: ['FoodScreen'],
  shows: 'Complete',
  scenario: demoWith({ then: async (repos, today) => repos.dayMarks.setCompleteness(today, 'complete') }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-692: yesterday marked partial: the caution chip at the hero's top right. */
export const DayPartial = screenStory({
  covers: ['FoodScreen'],
  shows: 'Partial',
  scenario: demoWith({ then: async (repos, today) => repos.dayMarks.setCompleteness(today.addDays(-1), 'partial') }),
  open: ({ state, today }) => {
    state.homeTab.put('food');
    state.selectedDay.put(today.addDays(-1));
  },
});

/** MM-692: the longest label, "Not marked", beside the day's figure and over what is left, on a 360 px phone (the demo marks every day, so today is unmarked here). */
export const DayNotMarkedSmallPhone = screenStory({
  covers: ['FoodScreen'],
  shows: 'Not marked',
  scenario: demoWith({ then: async (repos, today) => repos.dayMarks.setCompleteness(today, 'unmarked') }),
  open: ({ state }) => state.homeTab.put('food'),
  viewport: 'smallPhone',
});

/** MM-611: today marked a Refeed: the neutral chip in the day's header, and the row after the meals saying so (MM-655). */
export const DayMarkedRefeed = screenStory({
  covers: ['FoodScreen'],
  shows: 'Refeed',
  scenario: demoWith({ then: async (repos, today) => repos.dayKinds.setDayKind(today, 'refeed') }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-611: yesterday marked a Day off on a 360 px phone: the chip goes under the day rather than past the bar's edge. */
export const DayMarkedDayOffSmallPhone = screenStory({
  covers: ['FoodScreen'],
  shows: 'Day off',
  scenario: demoWith({ then: async (repos, today) => repos.dayKinds.setDayKind(today.addDays(-1), 'dayOff') }),
  open: ({ state, today }) => {
    state.homeTab.put('food');
    state.selectedDay.put(today.addDays(-1));
  },
  viewport: 'smallPhone',
});

/** MM-611, MM-655: the mark's row after the meals pressed: Refeed, Day off, and the way to clear a mark. */
export const MarkDay = screenStory({
  covers: ['FoodScreen'],
  shows: 'No mark',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Mark a refeed or a day off/ }));
  },
});

/** MM-321, MM-336: a glass of wine today at Full detail: the alcohol's energy and the fiber as rows of the hero. */
export const FoodWithAlcohol = screenStory({
  covers: ['FoodScreen'],
  shows: 'Alcohol',
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.preferences.saveDetailLevel('full');
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today, meal: 'dinner', name: 'Red wine', kcal: 125, proteinG: 0, carbsG: 4, fatG: 0, source: 'weighed', alcoholG: 15.6 }),
    );
  },
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-321: the macro split picture on Food. */
export const FoodSplit = screenStory({
  covers: ['FoodScreen'],
  shows: 'Split',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Split' }));
  },
});

/** MM-354: the split with nothing logged yet: a grey ring, centred, and what it needs. */
export const FoodSplitEmpty = screenStory({
  covers: ['FoodScreen'],
  shows: 'Log food with protein, carbs or fat to see the split.',
  scenario: firstDayScenario,
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Split' }));
  },
});

/** MM-321: Food while the pauses are still being read. */
export const FoodLoading = screenStory({
  covers: ['FoodScreen'],
  stores: waitingRead('pauses', 'watchPauses'),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-321: Food when the pauses could not be read. */
export const FoodPausesFailed = screenStory({
  covers: ['FoodScreen'],
  shows: 'Could not check whether this day is paused',
  stores: failingRead('pauses', 'watchPauses'),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-321: an estimate with no weigh-in kept (each one deleted): sizes wait for the person's own energy needs. */
export const AddFoodEstimateNoWeighIn = screenStory({
  covers: ['EstimateMealStep'],
  shows: /^Sizes are scaled to your own energy needs/,
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  },
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { estimateSize: 'regular' }),
});

/** MM-321: Saved with the person's own food and recipe. */
export const AddFoodSavedOwn = screenStory({
  covers: ['MyFoodsStep'],
  shows: 'Demo chili',
  scenario: withOwnFoods,
  open: addFood,
  walk: press('Saved'),
});

/** MM-321: a barcode the pack does not know: read the label, or enter it by hand. */
export const ScanUnknownCode = screenStory({
  covers: ['BarcodeScanStep'],
  shows: 'Read the label',
  open: addFood,
  walk: async (canvas) => {
    await press('Scan')(canvas);
    await userEvent.type(await inSheet(canvas).findByRole('textbox', { name: 'Or type the digits' }), '4006381333931');
    await press('Look up')(canvas);
  },
});

/** MM-321: a food whose numbers did not add up when the pack was built: the reason under its source. */
export const AddFoodAmountCheckThis = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Its calories and macros disagree by more than 20%.',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'trail mix' }),
  walk: press(/^Trail mix, house/),
});

/** MM-321: an entry kept from before amounts were recorded, opened to change: it asks how it was measured. */
export const EditFoodWithoutAmount = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'This entry was logged without an amount. To add one, choose how it was measured.',
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today, meal: 'lunch', name: 'Demo soup', kcal: 220, proteinG: 9, carbsG: 30, fatG: 6, source: 'weighed' }),
    );
  },
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Edit Demo soup' }));
  },
});

/** MM-321: a new food, the label read with no camera on the phone: it says so and the fields stay. */
/** MM-321: scanning on a phone whose camera is not allowed: type the digits instead. */
export const ScanNoCamera = screenStory({
  covers: ['BarcodeScanStep'],
  shows: /^The camera is not available/,
  open: addFood,
  walk: async (canvas) => {
    await press('Scan')(canvas);
    await press('Scan with the camera')(canvas);
  },
});

/** MM-321, MM-127: entered by hand with alcohol: two standard drinks typed, filling in their 28 g. */
export const AddFoodWithAlcohol = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'One standard drink is 14 g. Counted at 7 kcal per gram.',
  open: addFood,
  walk: async (canvas) => {
    await press('Enter manually')(canvas);
    await press('Includes alcohol?')(canvas);
    await userEvent.type(await inSheet(canvas).findByRole('textbox', { name: 'Standard drinks' }), '2');
  },
});

/** MM-58: the first unknown code on a phone that can ask online: the question, saying only the barcode number is sent and to whom. */
const typeUnknownCode = async (canvas: HTMLElement) => {
  await press('Scan')(canvas);
  await userEvent.type(await inSheet(canvas).findByRole('textbox', { name: 'Or type the digits' }), '4006381333931');
  await press('Look up')(canvas);
};

export const ScanAsksOnline = screenStory({
  covers: ['BarcodeScanStep'],
  shows: 'Just for now',
  device: onlineFoods(),
  open: addFood,
  walk: typeUnknownCode,
});

/** MM-58: allowed once, the product a service knows comes to its amount step, marked as found online. */
export const ScanFoundOnline = screenStory({
  covers: ['BarcodeScanStep', 'FoodAmountStep'],
  shows: /Found online/,
  device: onlineFoods(),
  open: addFood,
  walk: async (canvas) => {
    await typeUnknownCode(canvas);
    await press('Just for now')(canvas);
  },
});

/** MM-58: never: no request, and the label is offered as before. */
export const ScanNeverOnline = screenStory({
  covers: ['BarcodeScanStep'],
  shows: 'Read the label',
  device: onlineFoods(),
  open: addFood,
  walk: async (canvas) => {
    await typeUnknownCode(canvas);
    await press('Never')(canvas);
  },
});

/** MM-58: always allowed, and no service knows the code either. */
export const ScanNotFoundOnline = screenStory({
  covers: ['BarcodeScanStep'],
  shows: /not in the food database on this phone or online/,
  scenario: async (repos) => {
    await repos.preferences.saveOnlineLookup('always');
  },
  device: onlineFoods({ entries: [] }),
  open: addFood,
  walk: typeUnknownCode,
});

/** MM-58: always allowed, with no connection: said, and the label offered. */
export const ScanOnlineUnavailable = screenStory({
  covers: ['BarcodeScanStep'],
  shows: /could not be reached/,
  scenario: async (repos) => {
    await repos.preferences.saveOnlineLookup('always');
  },
  device: onlineFoods({ down: true }),
  open: addFood,
  walk: typeUnknownCode,
});

const typeSearch = (words: string) => async (canvas: HTMLElement) => {
  await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), words);
};

/** Chooses the online results at the top of the list (MM-652), where the Search online action is. */
const chooseOnline = async (canvas: HTMLElement) => {
  await press('Online')(canvas);
};

/** MM-58: searching never asks online by itself: the action under the Online choice of results (MM-652). */
export const SearchOnlineOffered = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Search online',
  device: onlineFoods(),
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('peanut noodle')(canvas);
    await chooseOnline(canvas);
  },
});

/** MM-652: a logged banana under "Yours", chosen for them because something of theirs matched. */
export const SearchResultsYours = screenStory({
  covers: ['AddFoodSheet'],
  shows: /From your log/,
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today.addDays(-1), meal: 'snack', name: 'Banana', kcal: 105, proteinG: 1, carbsG: 27, fatG: 0, source: 'quickAdd' }),
    );
  },
  open: addFood,
  walk: typeSearch('banana'),
});

/** MM-652: the food database's bananas, alone, once "Database" is chosen. */
export const SearchResultsDatabase = screenStory({
  covers: ['AddFoodSheet'],
  shows: /1 medium \(118 g\)/,
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today.addDays(-1), meal: 'snack', name: 'Banana', kcal: 105, proteinG: 1, carbsG: 27, fatG: 0, source: 'quickAdd' }),
    );
  },
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('banana')(canvas);
    await press('Database')(canvas);
  },
});

/** MM-652: "Yours" chosen with nothing of theirs matching: said, with the other choices a press away. */
export const SearchResultsYoursNothing = screenStory({
  covers: ['AddFoodSheet'],
  shows: /Nothing of yours matches/,
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('quinoa')(canvas);
    await press('Yours')(canvas);
  },
});

/** MM-58: the first online search asks, saying only the words typed are sent. */
export const SearchOnlineAsks = screenStory({
  covers: ['AddFoodSheet'],
  shows: /Only the words you typed are sent/,
  device: onlineFoods(),
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('peanut noodle')(canvas);
    await chooseOnline(canvas);
    await press('Search online')(canvas);
  },
});

/** MM-58: what a service found, listed under the phone's results with where each came from. */
export const SearchOnlineFound = screenStory({
  covers: ['AddFoodSheet'],
  shows: /Found online/,
  scenario: async (repos) => {
    await repos.preferences.saveOnlineLookup('always');
  },
  device: onlineFoods(),
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('peanut noodle')(canvas);
    await chooseOnline(canvas);
    await press('Search online')(canvas);
  },
});

/** MM-58: what a service found, beside the phone's own results, on a phone with a pack installed (the panel's F16). */
export const SearchOnlineBesidePack = screenStory({
  covers: ['AddFoodSheet'],
  shows: /Found online/,
  scenario: async (repos) => {
    await repos.preferences.saveOnlineLookup('always');
  },
  device: async (services) => onlineFoods()(await storyPackHost({ installed: '2026-10-09' })(services)),
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('noodle')(canvas);
    await chooseOnline(canvas);
    await press('Search online')(canvas);
  },
});

/** MM-58: a service that found nothing says so. */
export const SearchOnlineNothing = screenStory({
  covers: ['AddFoodSheet'],
  shows: /Nothing found online for/,
  scenario: async (repos) => {
    await repos.preferences.saveOnlineLookup('always');
  },
  device: onlineFoods({ entries: [] }),
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('quinoa')(canvas);
    await chooseOnline(canvas);
    await press('Search online')(canvas);
  },
});

/** MM-58: no connection when searching online: said, with a way to try again. */
export const SearchOnlineUnavailable = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Try again',
  scenario: async (repos) => {
    await repos.preferences.saveOnlineLookup('always');
  },
  device: onlineFoods({ down: true }),
  open: addFood,
  walk: async (canvas) => {
    await typeSearch('quinoa')(canvas);
    await chooseOnline(canvas);
    await press('Search online')(canvas);
  },
});

// ---- WS-08 M2 close (MM-167, MM-151, MM-152, MM-49, MM-150): the amount step and the form, every new state ----

/** The demo with 200 g of raw rice weighed yesterday from the pack, so the switch remembers raw (MM-151). */
const withRawRiceWeighed: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today.addDays(-1),
      meal: 'dinner',
      name: 'White rice, raw',
      kcal: 730,
      proteinG: 14,
      carbsG: 160,
      fatG: 1.4,
      source: 'weighed',
      portion: {
        method: 'weighed',
        basis: 'calculated',
        quantity: 200,
        unit: 'gram',
        reference: { basis: 'per100g', nutrition: new NutritionTotals({ kcal: 365, proteinG: 7, carbsG: 80, fatG: 0.7 }) },
        origin: { packId: FixturePack.packId, foodId: 3, source: 'fixture' },
        preparation: 'raw',
      },
    }),
  );
};

/** MM-152: a cooked food with a teaspoon of fat chosen: which fat, the usual one first, and the Logs line naming the second entry. */
export const AddFoodAmountCookedWithOil = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Which fat',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'white rice, cooked' }),
  walk: async (canvas) => {
    await press(/^White rice, cooked/)(canvas);
    await userEvent.click(await inSheet(canvas).findByRole('button', { name: '1 tsp' }));
  },
});

/** MM-151: white rice opened again after it was last weighed raw: the switch starts on Raw, by weight, from the whole log. */
export const AddFoodAmountRememberedRaw = screenStory({
  covers: ['FoodAmountStep'],
  shows: /^Logs 365 kcal/,
  scenario: withRawRiceWeighed,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'white rice, cooked' }),
  walk: press(/^White rice, cooked/),
});

/** MM-151, MM-564: the row of a food weighed raw says so: "200 g raw". */
export const FoodWeighedRaw = screenStory({
  covers: ['FoodScreen'],
  shows: /^200 g raw$/,
  scenario: withRawRiceWeighed,
  open: ({ state, today }) => {
    state.homeTab.put('food');
    state.selectedDay.put(today.addDays(-1));
  },
});

/** MM-564: a packaged food's row says its serving and weight only; "as packaged" and the basis are in its editor. */
export const FoodAsPackaged = screenStory({
  covers: ['FoodScreen'],
  shows: /^1 × 1 bar · 60 g$/,
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({
        id: 0,
        date: today,
        meal: 'snack',
        name: 'Protein bar, chocolate (Test Brand)',
        kcal: 228,
        proteinG: 19.8,
        carbsG: 21,
        fatG: 7.2,
        source: 'labelServing',
        portion: {
          method: 'labelServing',
          basis: 'calculated',
          quantity: 1,
          unit: 'serving',
          reference: {
            basis: 'per100g',
            nutrition: new NutritionTotals({ kcal: 380, proteinG: 33, carbsG: 35, fatG: 12 }),
            servingDescription: '1 bar',
            servingGrams: 60,
            servingUnit: 'serving',
          },
          origin: { packId: FixturePack.packId, foodId: 24, source: 'fixture' },
          preparation: 'packaged',
          conversion: { kind: 'servingWeight', gramsPerUnit: 60 },
        },
      }),
    );
  },
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-49: Simple detail on the amount step: calories and protein, no split; the whole food is logged. */
export const AddFoodAmountSimple = screenStory({
  covers: ['FoodAmountStep'],
  shows: /^Logs \d+ kcal · \d+ g protein$/,
  scenario: demoWith({ detail: 'simple' }),
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'chicken breast, cooked' }),
  walk: press(/^Chicken breast, cooked/),
});

/** MM-49: Simple detail on the typed form: calories and protein only. */
export const AddFoodManuallySimple = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'Protein g',
  scenario: demoWith({ detail: 'simple' }),
  open: addFood,
  walk: press('Enter manually'),
});

/** MM-49: Full detail on the typed form: the label's other lines, two to a line as a saved food's are. */
export const AddFoodManuallyFull = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'More from the label (optional)',
  scenario: demoWith({ detail: 'full' }),
  open: addFood,
  walk: press('Enter manually'),
});

/** MM-49, MM-564: at Full detail a row with the label's sugars and saturated fat stored keeps to its name, macros and amount. */
export const FoodFullLabelLines = screenStory({
  covers: ['FoodScreen'],
  shows: /P 12 · C 17 · F 4/,
  scenario: demoWith({
    detail: 'full',
    then: async (repos, today) => {
      await repos.food.addFood(
        new FoodEntry({
          id: 0,
          date: today,
          meal: 'snack',
          name: 'Greek yogurt, vanilla',
          kcal: 150,
          proteinG: 12,
          carbsG: 17,
          fatG: 4,
          source: 'labelServing',
          fiberG: 0,
          sodiumMg: 60,
          micros: new Micronutrients({ sugars: 15, saturatedFat: 3 }),
        }),
      );
    },
  }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-150, MM-596: an estimated meal found again in the log keeps its mark. */
export const AddFoodRecentEstimate = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'From your log · estimated · 900 kcal',
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({
        id: 0,
        date: today.addDays(-2),
        meal: 'dinner',
        name: 'Thai place, usual',
        kcal: 900,
        proteinG: 45,
        carbsG: 112,
        fatG: 30,
        source: 'quickAdd',
        portion: { method: 'quickAdd', basis: 'enteredTotals' },
      }),
    );
  },
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'thai');
  },
});

/** MM-153: "Fix this food" on a database food: the person's own copy, prefilled at its first serving, to correct and keep. */
export const FixThisFood = screenStory({
  covers: ['AddFoodSheet', 'FoodAmountStep', 'MyFoodsStep'],
  shows: /Your copy is what you find from now on/,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'protein bar' }),
  walk: async (canvas) => {
    await press(/^Protein bar, chocolate/)(canvas);
    await userEvent.click(await inSheet(canvas).findByRole('button', { name: 'Fix this food' }, { timeout: 10000 }));
  },
});

/** MM-417 follow-up: nothing logged today, a day logged yesterday: Food offers to copy it. */
export const FoodCopyYesterday = screenStory({
  covers: ['FoodScreen'],
  shows: 'Copy yesterday',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
    await repos.weights.saveWeight(today, 82);
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today.addDays(-1), meal: 'breakfast', name: 'Oatmeal', kcal: 300, proteinG: 10, carbsG: 54, fatG: 6, source: 'weighed' }),
    );
  },
  open: ({ state }) => state.homeTab.put('food'),
});

// ---- MM-510: the calorie card on a weight-loss medication (MM-113) ----

/** MM-113: protein first, above the calories, and the target a level to reach: what is logged so far and the aim. */
export const FoodOnWeightLossMedication = screenStory({
  covers: ['FoodScreen'],
  shows: /^so far, aiming for about 2,100 kcal/,
  scenario: weightLossMedicationScenario(),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-113: over the target on the medication: the usual "over" words. */
export const FoodOverOnWeightLossMedication = screenStory({
  covers: ['FoodScreen'],
  shows: /^over 2,100/,
  scenario: weightLossMedicationScenario({ todayKcal: 2600 }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-113: the same day with the answer not ticked: what is left, and protein in its usual place. */
export const FoodNotOnWeightLossMedication = screenStory({
  covers: ['FoodScreen'],
  shows: /^left of 2,100/,
  scenario: weightLossMedicationScenario({ ticked: false }),
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-575: marking a day complete asks about the easy-to-miss foods first; only "nothing missed" marks it. */
export const EasyToMissCheck = screenStory({
  covers: ['EasyToMissSheet'],
  shows: 'Anything easy to miss?',
  open: ({ overlays, state }) => {
    state.homeTab.put('food');
    void showEasyToMissSheet(overlays);
  },
});

/** MM-571, MM-572: the hero as a running total over the clock, passed at dinner, with the usual day drawn under it. */
export const HeroRunningTotal = screenStory({
  covers: ['FoodScreen'],
  shows: /^You passed your target at dinner, 7:15 PM\./,
  scenario: runningTotalScenario({ usualDays: 7 }),
  open: yesterdaysFood,
});

/** MM-572: the usual day before there are enough days with meal times: it says what it waits for, with the count. */
export const HeroUsualDayWaiting = screenStory({
  covers: ['FoodScreen'],
  shows: 'Your usual day appears after 7 days with meal times · 2 of 7',
  scenario: runningTotalScenario({ usualDays: 2 }),
  open: yesterdaysFood,
});

/** MM-624: a typed food that could not be logged: said above Log it, the form kept to try again. */
export const AddFoodLogFailed = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^The food could not be logged/,
  stores: failingWrite('food', 'addFood'),
  open: addFood,
  walk: async (canvas) => {
    await press('Enter manually')(canvas);
    const sheet = within(canvas);
    await userEvent.type(sheet.getByRole('textbox', { name: 'Food name' }), 'Granola');
    await userEvent.type(sheet.getByRole('textbox', { name: 'Protein g' }), '10');
    await userEvent.type(sheet.getByRole('textbox', { name: /^Calories/ }), '200');
    await press('Log it')(canvas);
  },
});

/** MM-624: a change to a logged food that could not be saved: said above Save changes, the food as it was. */
export const EditFoodSaveFailed = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^The change could not be saved/,
  stores: failingWrite('food', 'updateFood'),
  open: async ({ services, overlays, today }) => {
    const [entry] = await valueOf(services.food.watchFood(today));
    if (entry !== undefined) void showAddFoodSheet(overlays, today, { entry });
  },
  walk: press('Save changes'),
});

/** MM-624: a found food that could not be logged: said above Log it, nothing logged, its fat neither. */
export const AddFoodAmountLogFailed = screenStory({
  covers: ['FoodAmountStep'],
  shows: /^The food could not be logged/,
  stores: failingWrite('food', 'applyFoodChanges'),
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'chicken breast, cooked' }),
  walk: async (canvas) => {
    await press(/^Chicken breast, cooked/)(canvas);
    await press('Log it')(canvas);
  },
});

/** MM-624: an estimate that could not be logged: said above its action. */
export const AddFoodEstimateLogFailed = screenStory({
  covers: ['EstimateMealStep'],
  shows: /^The estimate could not be logged/,
  stores: failingWrite('food', 'addFood'),
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { estimateSize: 'regular' }),
  walk: press('Log the estimate'),
});

/** MM-631: finds `query`, opens its pack result and puts it in the meal's list. */
const addToMeal = (query: string, name: RegExp) => async (canvas: HTMLElement) => {
  const search = await within(canvas).findByRole('textbox', { name: 'Search foods' }, { timeout: 10000 });
  await userEvent.clear(search);
  await userEvent.type(search, query);
  // The database's results, whatever of the demo's log matched (MM-652).
  await press('Database')(canvas);
  await press(name)(canvas);
  await press('Add another food')(canvas);
};

/** MM-631: one food in the meal's list: the list under the search, its meal and time, and Log 1 food. */
export const AddFoodSessionOne = screenStory({
  covers: ['AddFoodSheet', 'FoodAmountStep'],
  shows: /^In this meal · 1 food/,
  open: addFood,
  walk: addToMeal('chicken breast, cooked', /^Chicken breast, cooked/),
});

/** MM-631: three foods in the meal's list, each with a way to take it out. */
export const AddFoodSessionMany = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^In this meal · 3 foods/,
  open: addFood,
  walk: async (canvas) => {
    await addToMeal('chicken breast, cooked', /^Chicken breast, cooked/)(canvas);
    await addToMeal('white rice, cooked', /^White rice, cooked/)(canvas);
    await addToMeal('banana', /^Banana/)(canvas);
    // The search cleared, the list shows its foods and its action.
    await userEvent.clear(await within(canvas).findByRole('textbox', { name: 'Search foods' }));
  },
});

/** MM-631: the next food's amount, in a meal's list: no meal or time asked, and Log 2 foods. */
export const AddFoodSessionAmount = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Log 2 foods',
  open: addFood,
  walk: async (canvas) => {
    await addToMeal('chicken breast, cooked', /^Chicken breast, cooked/)(canvas);
    const search = await within(canvas).findByRole('textbox', { name: 'Search foods' });
    await userEvent.clear(search);
    await userEvent.type(search, 'white rice, cooked');
    await press(/^White rice, cooked/)(canvas);
  },
});

/** MM-631: the list could not be logged: said above its action, none logged, the list kept. */
export const AddFoodSessionLogFailed = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^The foods could not be logged/,
  stores: failingWrite('food', 'applyFoodChanges'),
  open: addFood,
  walk: async (canvas) => {
    await addToMeal('chicken breast, cooked', /^Chicken breast, cooked/)(canvas);
    await userEvent.clear(await within(canvas).findByRole('textbox', { name: 'Search foods' }));
    await press('Log 1 food')(canvas);
  },
});

/** MM-645: today's food saved as a meal, its name taken from its foods. */
export const SaveMeal = screenStory({
  covers: ['SaveMealSheet'],
  shows: 'Save meal',
  open: async ({ services, overlays, today }) => {
    const foods = await valueOf(services.food.watchFood(today));
    void showSaveMealSheet(overlays, foods.slice(0, 3));
  },
});

/** MM-645: Saved with a saved meal above the saved foods, and found by search. */
export const AddFoodSavedMeals = screenStory({
  covers: ['AddFoodSheet', 'MyFoodsStep'],
  shows: 'Your meals',
  scenario: async (repos, today) => {
    await repos.customFoods.saveCustomFood(
      new CustomFood({
        id: 0,
        name: 'Protein bar',
        kind: 'food',
        servingDescription: '1 bar',
        servingGrams: 60,
        perServing: new NutritionTotals({ kcal: 220, proteinG: 20, carbsG: 22, fatG: 7 }),
      }),
    );
    await repos.savedMeals.saveMeal(
      'Usual breakfast',
      [
        new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Oats', kcal: 300, proteinG: 10, carbsG: 54, fatG: 5, source: 'weighed' }),
        new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Berries', kcal: 40, proteinG: 1, carbsG: 9, fatG: 0, source: 'weighed' }),
      ],
      today,
    );
  },
  open: addFood,
  walk: press('Saved'),
});

/** MM-645: a saved meal found by search, among the person's own. */
export const AddFoodSavedMealFound = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Your meal · logs 1 food/,
  scenario: async (repos, today) => {
    await repos.savedMeals.saveMeal(
      'Usual breakfast',
      [new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Oats', kcal: 300, proteinG: 10, carbsG: 54, fatG: 5, source: 'weighed' })],
      today,
    );
  },
  open: addFood,
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search foods' }), 'usual');
  },
});

/** MM-645: a meal that could not be saved: said above Save meal, and in a snack. */
export const SaveMealFailed = screenStory({
  covers: ['SaveMealSheet'],
  shows: /^The meal could not be saved/,
  stores: failingWrite('savedMeals', 'saveMeal'),
  open: async ({ services, overlays, today }) => {
    const foods = await valueOf(services.food.watchFood(today));
    void showSaveMealSheet(overlays, foods.slice(0, 2));
  },
  walk: press('Save meal'),
});


/** MM-651: a drink the pack states per 100 mL: by the can, the fluid ounce or the millilitre; no weight without a density. */
export const AddFoodAmountDrink = screenStory({
  covers: ['FoodAmountStep'],
  shows: '1 can (355 mL)',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'cola classic' }),
  walk: press(/^Cola, classic/),
});

/** MM-651: a drink with a density: grams and ounces offered too, and its cup said in grams. */
export const AddFoodAmountDrinkWithDensity = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Grams',
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'oat drink barista' }),
  walk: press(/^Oat drink, barista/),
});

/** MM-651: a found drink's row says its can and its calories per 100 mL. */
export const AddFoodSearchDrink = screenStory({
  covers: ['AddFoodSheet'],
  shows: /per 100 mL/,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'cola classic' }),
});

/** MM-651: a logged can opened again: its serving and every volume, no weight, its numbers per 100 mL. */
export const EditFoodDrink = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Per 100 mL/,
  open: ({ state, overlays, today }) => {
    state.homeTab.put('food');
    void showAddFoodSheet(overlays, today, { initialQuery: 'cola classic' });
  },
  walk: async (canvas) => {
    await press(/^Cola, classic/)(canvas);
    await userEvent.click(await inSheet(canvas).findByRole('button', { name: 'Log it' }));
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Edit Cola, classic/ }));
  },
});

/** MM-651: a drink's eight chips at 200% text (the UX guard's UX-4): they wrap above the field and stay in order. */
export const AddFoodAmountDrinkWithDensityLargeText = screenStory({
  covers: ['FoodAmountStep'],
  shows: 'Ounces (weight)',
  textScale: 2,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'oat drink barista' }),
  walk: press(/^Oat drink, barista/),
});

/** MM-651: a can changed into fluid ounces is the same portion, said so; the field reads 12. */
export const AddFoodAmountDrinkFluidOunces = screenStory({
  covers: ['FoodAmountStep'],
  shows: /^Same amount as 1 × 1 can \(355 mL\)\./,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today, { initialQuery: 'cola classic' }),
  walk: async (canvas) => {
    await press(/^Cola, classic/)(canvas);
    const servings = await inSheet(canvas).findByRole('textbox', { name: 'How many servings' });
    await userEvent.clear(servings);
    await userEvent.type(servings, '1');
    await userEvent.click(await inSheet(canvas).findByRole('button', { name: 'Fluid ounces' }));
  },
});
