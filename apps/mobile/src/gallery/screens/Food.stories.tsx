import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { showAddFoodSheet } from '../../food/showAddFoodSheet';
import { firstDayScenario } from './firstDayScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import type { StoryStage } from './StoryStage';
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
