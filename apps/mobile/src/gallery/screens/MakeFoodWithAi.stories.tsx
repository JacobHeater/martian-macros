import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { FixturePhotoCamera } from '../../fixtures/FixturePhotoCamera';
import { InMemoryClipboard } from '../../fixtures/InMemoryClipboard';
import { InMemoryMealShare } from '../../fixtures/InMemoryMealShare';
import { InMemoryPhotoLibrary } from '../../fixtures/InMemoryPhotoLibrary';
import { MakeFoodWithAiScreen } from '../../food/ai/MakeFoodWithAiScreen';
import { showAddFoodSheet } from '../../food/showAddFoodSheet';
import type { AppServices } from '../../state/AppServices';
import { failingWrite } from './failingWrite';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import { cleanFoodAnswer, homemadeFoodAnswer, troubledFoodAnswer } from './storyFoodAnswers';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';

/**
 * Make a food with my AI (MM-708): what the person knows about the food
 * and its photos handed to their own assistant, its answer pasted back
 * and reviewed, every problem said on its food, and each ticked food
 * saved with its group, its evidence and what went into it (MM-710). The
 * screen is reached from the Library's New food (MM-706); the stories open
 * it directly.
 */
const meta = { title: 'Screens/Make a food with my AI', ...screensMeta } satisfies Meta;
export default meta;

const open = ({ navigator }: StoryStage) => void navigator.push(() => <MakeFoodWithAiScreen onDone={() => undefined} />);

/** A phone whose clipboard holds `text`, or refuses to be read. */
const clipboard =
  (text: string | undefined, { refusesRead = false }: { refusesRead?: boolean } = {}) =>
  async (services: AppServices): Promise<AppServices> => {
    const held = new InMemoryClipboard(text);
    held.refusesRead = refusesRead;
    return { ...services, clipboard: held };
  };

/** A phone whose camera reads this barcode every time it is asked. */
const scanning = (digits: string) => async (services: AppServices): Promise<AppServices> => ({
  ...services,
  barcodeScanner: { scan: () => Promise.resolve({ digits, symbology: 'ean13' }) },
});

/** A phone whose share sheet does `outcome`, or cannot share at all (MM-599). */
const sharing =
  ({ available = true, outcome = 'sent' }: { available?: boolean; outcome?: InMemoryMealShare['outcome'] }) =>
  async (services: AppServices): Promise<AppServices> => {
    const share = new InMemoryMealShare({ available });
    share.outcome = outcome;
    return { ...services, mealShare: share };
  };

const page = (canvas: HTMLElement) => within(canvas.ownerDocument.body);
const press = (name: string | RegExp) => async (canvas: HTMLElement) =>
  userEvent.click(await page(canvas).findByRole('button', { name }, { timeout: 10000 }));
const choose = (name: string) => async (canvas: HTMLElement) => userEvent.click(await page(canvas).findByRole('menuitem', { name }));
const pasted = press('Paste from clipboard');

/** The demo with a saved yogurt of the clean answer's name, and a biscuit the assistant estimated (MM-710). */
const withSavedFoods: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Greek yogurt, plain nonfat',
      kind: 'food',
      servingDescription: '1 cup',
      servingGrams: 227,
      perServing: new NutritionTotals({ kcal: 134, proteinG: 23, carbsG: 8, fatG: 1 }),
      evidence: { kind: 'label' },
      group: 'dairyAndYogurt',
    }),
  );
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Buttermilk biscuit, extra flaky, from the bakery on Main Street',
      kind: 'food',
      servingDescription: '1 biscuit',
      servingGrams: 60,
      perServing: new NutritionTotals({ kcal: 212, proteinG: 3.9, carbsG: 26.4, fatG: 9.8 }),
      fiberG: 0.9,
      group: 'breadsAndGrains',
      evidence: { kind: 'estimated', citation: 'Estimated from the ingredients and the photo' },
      madeOf: [{ name: 'All-purpose flour', grams: 30 }, { name: 'Buttermilk', grams: 22 }, { name: 'Butter', grams: 10 }],
    }),
  );
};

/** MM-708: the questions and the photos, ending in Copy prompt and the place to paste the answer. */
export const MakeFoodAsk = screenStory({ covers: ['MakeFoodWithAiScreen'], shows: 'Copy prompt', open });

/** MM-708: Homemade on: the brand goes, and the assistant is to list what went into it. */
export const MakeFoodAskHomemade = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^Your assistant lists what likely went into it/,
  open,
  walk: async (canvas) => userEvent.click(await page(canvas).findByRole('switch', { name: /^Homemade/ })),
});

/** MM-708: the prompt copied: the button says so itself, with a check. */
export const MakeFoodPromptCopied = screenStory({ covers: ['MakeFoodWithAiScreen'], shows: 'Prompt copied', open, walk: press('Copy prompt') });

/** MM-589: a phone that refuses the copy: said in a notice with its icon, under the button. */
export const MakeFoodCopyRefused = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^The phone did not allow copying/,
  device: async (services) => {
    const held = new InMemoryClipboard();
    held.refusesWrite = true;
    return { ...services, clipboard: held };
  },
  open,
  walk: press('Copy prompt'),
});

/** MM-708: photos chosen: small, each with its remove button, and the part ends in Send to my assistant. */
export const MakeFoodWithPhotos = screenStory({ covers: ['MakeFoodWithAiScreen'], shows: 'Send to my assistant', open, walk: press('Choose photos') });

/** MM-708: sent: the button says so itself, with a check, and the answer is pasted below. */
export const MakeFoodSent = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: 'Sent',
  open,
  walk: async (canvas) => {
    await press('Choose photos')(canvas);
    await press('Send to my assistant')(canvas);
  },
});

/** MM-599: a share sheet that would not open: the prompt is copied, and the photos are attached in the assistant. */
export const MakeFoodShareFailed = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^The share sheet could not be opened/,
  device: sharing({ outcome: 'unavailable' }),
  open,
  walk: async (canvas) => {
    await press('Choose photos')(canvas);
    await press('Send to my assistant')(canvas);
  },
});

/** MM-599: a phone that cannot hand photos to another app: said, and the part copies the prompt. */
export const MakeFoodCannotShare = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^This phone cannot hand photos to another app/,
  device: sharing({ available: false }),
  open,
  walk: press('Choose photos'),
});

/** MM-708: six photos, the most a food is sent with: the photo buttons are off. */
export const MakeFoodSixPhotos = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: 'Photos · 6 of 6',
  device: async (services) => ({ ...services, photoLibrary: new InMemoryPhotoLibrary({ chosen: 6 }) }),
  open,
  walk: press('Choose photos'),
});

/** MM-599: the camera inside the screen, facing away, for a photo of the food. */
export const MakeFoodCamera = screenStory({ covers: ['MakeFoodWithAiScreen'], shows: 'Take photo', open, walk: press('Take a photo') });

/** MM-599: a camera that could not be opened: said, with Try again. */
export const MakeFoodCameraRefused = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: 'The camera could not be opened',
  device: async (services) => ({ ...services, photoCamera: new FixturePhotoCamera({ available: false }) }),
  open,
  walk: press('Take a photo'),
});

/** MM-708: a barcode scanned, shown on its row with the way to drop it. */
export const MakeFoodBarcode = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^Scanned: /,
  device: scanning('0012345678905'),
  open,
  walk: press('Scan the barcode'),
});

/** MM-413: a camera that cannot scan: said under the barcode row. */
export const MakeFoodScanRefused = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^The camera is not available/,
  open,
  walk: press('Scan the barcode'),
});

/** MM-709: text typed into the field that holds no food: the person is told why, and what to paste. */
export const MakeFoodUnreadable = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^There is no food in this text/,
  open,
  walk: async (canvas) => {
    await userEvent.type(await page(canvas).findByRole('textbox', { name: 'Or paste the answer here' }), 'Sure, here you go!');
    await press('Read the answer')(canvas);
  },
});

/** MM-590: a phone that will not hand over its clipboard: the field is the way in. */
export const MakeFoodClipboardRefused = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^The phone did not hand over the clipboard/,
  device: clipboard(cleanFoodAnswer, { refusesRead: true }),
  open,
  walk: pasted,
});

/** MM-708: a clean answer to review: each food with its group, serving, numbers, grade and source line, ticked to be saved. */
export const MakeFoodReview = screenStory({ covers: ['MakeFoodWithAiScreen'], shows: 'Review the foods', device: clipboard(cleanFoodAnswer), open, walk: pasted });

/** MM-708: a homemade food: what the assistant says went into it, under its row. */
export const MakeFoodReviewHomemade = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^Made of All-purpose flour/,
  device: clipboard(homemadeFoodAnswer),
  open,
  walk: pasted,
});

/** MM-708: a homemade food opened to change, under its row: every number per 100 g and its ingredients, each removable. */
export const MakeFoodChangeFood = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: 'Numbers per 100 g',
  device: clipboard(homemadeFoodAnswer),
  open,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('More actions for Buttermilk biscuit')(canvas);
    await choose('Change')(canvas);
  },
});

/** MM-709: a change saved with a problem still in it is refused, and the problem said under the form. */
export const MakeFoodChangeRefused = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^Missing its food group\. Missing vitamin d/,
  device: clipboard(troubledFoodAnswer),
  open,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('More actions for Pancake')(canvas);
    await choose('Change')(canvas);
    await press('Save changes')(canvas);
  },
});

/** MM-708: a food of a name already saved: its row asks whether to update that food or keep both. */
export const MakeFoodReviewSameName = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^You have Greek yogurt, plain nonfat already/,
  scenario: withSavedFoods,
  device: clipboard(cleanFoodAnswer),
  open,
  walk: pasted,
});

/** MM-709: an answer with problems: each said on its food, the fixes to copy back, and Save saying what it waits for. */
export const MakeFoodReviewProblems = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /fixing or unticking before saving/,
  device: clipboard(troubledFoodAnswer),
  open,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('Save 2 foods')(canvas);
  },
});

/** MM-708: a barcode scanned and an answer of several foods: the barcode goes on none, and the review says so. */
export const MakeFoodReviewBarcodeUnplaced = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^The scanned barcode was put on no food/,
  device: async (services) => scanning('0012345678905')(await clipboard(cleanFoodAnswer)(services)),
  open,
  walk: async (canvas) => {
    await press('Scan the barcode')(canvas);
    await pasted(canvas);
  },
});

/** MM-624: the foods could not be saved: said above Save, with the review kept. */
export const MakeFoodSaveFailed = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: /^The foods could not be saved/,
  device: clipboard(homemadeFoodAnswer),
  stores: failingWrite('customFoods', 'saveCustomFood'),
  open,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('Save 1 food')(canvas);
  },
});

/** MM-708, at phone width: the longest name saved, a same-name row with both chips, and the group chooser open. */
export const MakeFoodReviewSmallPhone = screenStory({
  covers: ['MakeFoodWithAiScreen'],
  shows: 'Food group',
  viewport: 'smallPhone',
  scenario: withSavedFoods,
  device: clipboard(cleanFoodAnswer),
  open,
  walk: async (canvas) => {
    await pasted(canvas);
    await press('More actions for Greek yogurt, plain nonfat')(canvas);
    await choose('Change')(canvas);
    await userEvent.click(await page(canvas).findByRole('button', { name: /^Food group/ }));
  },
});

/** MM-710: the Saved step says where each saved food's numbers came from; an unverified estimate stands out. */
export const AddFoodSavedWithEvidence = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^AI estimate, unverified/,
  scenario: withSavedFoods,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today),
  walk: press('Saved'),
});

/** MM-710: a saved food found by search, under Yours, with its mark. */
export const AddFoodYoursWithEvidence = screenStory({
  covers: ['AddFoodSheet'],
  shows: /^Read from the label/,
  scenario: withSavedFoods,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today),
  walk: async (canvas) => {
    await userEvent.type(await page(canvas).findByRole('textbox', { name: 'Search foods' }), 'greek');
  },
});

/** MM-710: the amount step of a homemade saved food: About this food says its evidence and what went into it. */
export const AmountOfSavedFoodMadeOf = screenStory({
  covers: ['FoodAmountStep'],
  shows: /^Made of: /,
  scenario: withSavedFoods,
  open: ({ overlays, today }) => void showAddFoodSheet(overlays, today),
  walk: async (canvas) => {
    await press('Saved')(canvas);
    await press(/^Buttermilk biscuit, extra flaky/)(canvas);
    await press('About this food')(canvas);
  },
});
