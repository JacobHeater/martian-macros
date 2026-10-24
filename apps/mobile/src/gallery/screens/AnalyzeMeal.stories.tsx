import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { InMemoryClipboard } from '../../fixtures/InMemoryClipboard';
import { showViewMealSheet } from '../../food/meal/showViewMealSheet';
import { showAddFoodSheet } from '../../food/showAddFoodSheet';
import type { AppServices } from '../../state/AppServices';
import { failingWrite } from './failingWrite';
import { loggedMealScenario, storyMealKey } from './loggedMealScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import { cleanMealAnswer, troubledMealAnswer } from './storyMealAnswers';
import type { StoryStage } from './StoryStage';

/**
 * AI meal analysis (MM-586) and a meal once it is logged (MM-587): the
 * prompt copied to the person's own assistant, its answer pasted back and
 * reviewed, every problem said on its food, and the meal as one row that
 * opens to its foods.
 */
const meta = { title: 'Screens/AI meal analysis', ...screensMeta } satisfies Meta;
export default meta;

/** Add food, where the analysis is offered (MM-598). */
const addFood = ({ overlays, today }: StoryStage) => void showAddFoodSheet(overlays, today);

/** A phone whose clipboard holds `text`, or refuses to be read. */
const clipboard =
  (text: string | undefined, { refusesRead = false }: { refusesRead?: boolean } = {}) =>
  async (services: AppServices): Promise<AppServices> => {
    const held = new InMemoryClipboard(text);
    held.refusesRead = refusesRead;
    return { ...services, clipboard: held };
  };

const sheet = (canvas: HTMLElement) => within(canvas.ownerDocument.body);
const press = (name: string | RegExp) => async (canvas: HTMLElement) =>
  userEvent.click(await sheet(canvas).findByRole('button', { name }, { timeout: 10000 }));
const choose = (name: string) => async (canvas: HTMLElement) =>
  userEvent.click(await sheet(canvas).findByRole('menuitem', { name }));

/** Opens the analysis, then pastes what the clipboard holds. */
const pasted = async (canvas: HTMLElement) => {
  await press('AI meal analysis')(canvas);
  await press('Paste from clipboard')(canvas);
};

/** MM-598: Add food offers the analysis on its first view, above Scan, Saved and Estimate. */
export const AddFoodOffersAnalysis = screenStory({
  covers: ['AddFoodSheet'],
  shows: 'AI meal analysis',
  open: addFood,
});

/** MM-586: the analysis's first step, with the prompt to copy and the place to paste the answer. */
export const AnalyzeMealStart = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: 'Copy prompt',
  open: addFood,
  walk: press('AI meal analysis'),
});

/** MM-586: the prompt copied: the button says so itself, with a check. */
export const AnalyzeMealPromptCopied = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: 'Prompt copied',
  open: addFood,
  walk: async (canvas) => {
    await press('AI meal analysis')(canvas);
    await press('Copy prompt')(canvas);
  },
});

/** MM-586, MM-589: a phone that refuses the copy: said in a notice with its icon, under the button. */
export const AnalyzeMealCopyRefused = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: /^The phone did not allow copying/,
  device: async (services) => {
    const held = new InMemoryClipboard();
    held.refusesWrite = true;
    return { ...services, clipboard: held };
  },
  open: addFood,
  walk: async (canvas) => {
    await press('AI meal analysis')(canvas);
    await press('Copy prompt')(canvas);
  },
});

/** MM-586: text typed into the field that holds no meal: the person is told why, and what to paste. */
export const AnalyzeMealUnreadable = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: /^There is no meal in this text/,
  open: addFood,
  walk: async (canvas) => {
    await press('AI meal analysis')(canvas);
    await userEvent.type(await sheet(canvas).findByRole('textbox', { name: 'Or paste the answer here' }), 'Sure, here you go!');
    await press('Read the answer')(canvas);
  },
});

/** MM-586: a phone that will not hand over its clipboard: the field is the way in. */
export const AnalyzeMealClipboardRefused = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: /^The phone did not hand over the clipboard/,
  device: clipboard(cleanMealAnswer, { refusesRead: true }),
  open: addFood,
  walk: pasted,
});

/** MM-586: a clean answer to review: each food with its numbers, grade and source line, the meal's total and grade. */
export const AnalyzeMealReview = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: 'Review the meal',
  device: clipboard(cleanMealAnswer),
  open: addFood,
  walk: pasted,
});

/** MM-586: a food opened to change, under its row. */
export const AnalyzeMealChangeFood = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: 'Grams eaten',
  device: clipboard(cleanMealAnswer),
  open: addFood,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('More actions for White rice')(canvas);
    await choose('Change')(canvas);
  },
});

/** MM-586: a food being added by hand. */
export const AnalyzeMealAddFood = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: 'Look up in the app’s foods',
  device: clipboard(cleanMealAnswer),
  open: addFood,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('Add a food')(canvas);
  },
});

/** MM-586: an answer with problems: each said on its food, the fixes to copy back, and Log meal saying what it waits for. */
export const AnalyzeMealProblems = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: /fixing or removing before the meal can be logged/,
  device: clipboard(troubledMealAnswer),
  open: addFood,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('Log meal')(canvas);
  },
});

/** MM-591: the meal could not be logged: said above Log meal, with nothing logged and the review kept. */
export const AnalyzeMealLogFailed = screenStory({
  covers: ['AnalyzeMealStep'],
  shows: /^The meal could not be logged/,
  device: clipboard(cleanMealAnswer),
  stores: failingWrite('food', 'addFood'),
  open: addFood,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('Log meal')(canvas);
  },
});

/** MM-587: a logged meal on Food, as one row with its foods counted, its calories and its grade. */
export const FoodWithLoggedMeal = screenStory({
  covers: ['FoodScreen'],
  shows: 'Chicken and rice',
  scenario: loggedMealScenario,
  open: ({ state }) => state.homeTab.put('food'),
});

/** MM-587: the meal logged again from Recent foods in one press. */
export const AddFoodRecentMeal = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Your recent meal/,
  scenario: loggedMealScenario,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today),
});

/** MM-587, MM-596: a meal found by search, from the whole log. */
export const AddFoodSearchFindsMeal = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^From your log · 3 foods/,
  scenario: loggedMealScenario,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today),
  walk: async (canvas) => {
    await userEvent.type(await sheet(canvas).findByRole('textbox', { name: 'Search foods' }), 'chicken and');
  },
});

/** MM-587: View meal: the meal's foods, its totals and grade, where it is logged, and its actions. */
export const ViewMeal = screenStory({
  covers: ['ViewMealSheet'],
  shows: 'Logged in',
  scenario: loggedMealScenario,
  open: ({ overlays, today }) => void showViewMealSheet(overlays, today, storyMealKey),
});

/** MM-587: a food of a logged meal changed so that it is missing a number: it is not saved, and says why. */
export const ViewMealChangeRefused = screenStory({
  covers: ['ViewMealSheet'],
  shows: /^Missing calories/,
  scenario: loggedMealScenario,
  open: ({ overlays, today }) => void showViewMealSheet(overlays, today, storyMealKey),
  walk: async (canvas) => {
    await press('More actions for White rice')(canvas);
    await choose('Change')(canvas);
    await userEvent.clear(await sheet(canvas).findByRole('textbox', { name: 'Calories' }));
    await press('Save food')(canvas);
  },
});

/** MM-587: a food being added to a logged meal. */
export const ViewMealAddFood = screenStory({
  covers: ['ViewMealSheet'],
  shows: 'Add food',
  scenario: loggedMealScenario,
  open: ({ overlays, today }) => void showViewMealSheet(overlays, today, storyMealKey),
  walk: press('Add a food'),
});

/** MM-587: View meal for a meal no longer in the log (deleted from elsewhere): it says so. */
export const ViewMealGone = screenStory({
  covers: ['ViewMealSheet'],
  shows: 'This meal is no longer in the log.',
  scenario: loggedMealScenario,
  open: ({ overlays, today }) => void showViewMealSheet(overlays, today, 'no-such-meal'),
});
