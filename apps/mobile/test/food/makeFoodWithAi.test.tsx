import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryClipboard } from '../../src/fixtures/InMemoryClipboard';
import { InMemoryMealShare } from '../../src/fixtures/InMemoryMealShare';
import { InMemoryPhotoLibrary } from '../../src/fixtures/InMemoryPhotoLibrary';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { MakeFoodWithAiScreen } from '../../src/food/ai/MakeFoodWithAiScreen';
import { foodPromptWith } from '../../src/format/foodPromptWith';
import { cleanFoodAnswer, homemadeFoodAnswer, troubledFoodAnswer } from '../../src/gallery/screens/storyFoodAnswers';
import type { AppServices } from '../../src/state/AppServices';
import { press, typeIn } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';
import { scannerReading } from '../support/scannerReading';
import { topLayer } from '../support/topLayer';

/** MM-708: Make a food with my AI, from the questions to the foods saved; MM-709 and MM-710 through it. */
const today = CalendarDate.of(2026, 10, 30);
let repos: InMemoryRepositories;
let clipboard: InMemoryClipboard;
let mealShare: InMemoryMealShare;
let photoLibrary: InMemoryPhotoLibrary;
let done: readonly CustomFood[] | undefined;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  clipboard = new InMemoryClipboard();
  mealShare = new InMemoryMealShare();
  photoLibrary = new InMemoryPhotoLibrary();
  done = undefined;
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** Opens the screen as the Library will (MM-706), with `change` made to the app's services. */
async function open(change: (services: AppServices) => AppServices = (services) => services): Promise<HTMLElement> {
  renderApp(repos, today, {
    change: (services) => ({ ...change(services), clipboard, mealShare, photoLibrary }),
    open: ({ navigator }) => void navigator.push((close) => <MakeFoodWithAiScreen onDone={(saved) => { done = saved; close(); }} />),
  });
  await screen.findByRole('heading', { name: 'About the food' });
  return topLayer();
}

/** Puts `text` on the clipboard and pastes it, then waits for the review. */
async function paste(page: HTMLElement, text: string): Promise<void> {
  clipboard.text = text;
  await press(page, 'Paste from clipboard');
  await within(page).findByRole('heading', { name: 'Review the foods' });
}

const saved = () => first(repos.customFoods.watchCustomFoods());
const gtin14 = '00012345678905';
const ean13 = gtin14.substring(1);

it('asks the questions, and Copy prompt puts the prompt with the answers on the clipboard', async () => {
  const page = await open();
  for (const field of ['Food name', 'Brand or restaurant', 'One serving is', 'Weighs g', 'Anything else that would help your assistant?']) {
    expect(within(page).getByRole('textbox', { name: field })).toBeInTheDocument();
  }
  await typeIn(page, 'Food name', 'Buttermilk biscuit');
  await userEvent.click(within(page).getByRole('switch', { name: /^Homemade/ }));
  expect(within(page).queryByRole('textbox', { name: 'Brand or restaurant' }), 'a homemade food has no brand').not.toBeInTheDocument();
  await typeIn(page, 'One serving is', '1 biscuit');
  await typeIn(page, 'Weighs g', '60');
  await typeIn(page, 'Anything else that would help your assistant?', 'extra flaky');
  await press(page, 'Copy prompt');
  const prompt = foodPromptWith(
    { name: 'Buttermilk biscuit', homemade: true, from: '', serving: '1 biscuit', servingGrams: 60, barcode: undefined, notes: 'extra flaky', photosAttached: false },
    today,
  );
  expect(clipboard.text).toBe(prompt);
  expect(prompt).toContain('- It is called "Buttermilk biscuit".');
  expect(prompt).toContain('- It is homemade.');
  expect(prompt).toContain('- Today is Friday, October 30, 2026.');
  expect(prompt, 'nothing about the person').not.toMatch(/target|goal|kg|lb/);
  expect(await within(page).findByRole('button', { name: 'Prompt copied' }), 'the button says so, with a check').toBeInTheDocument();
  expect(within(page).getByText('Copied. Paste it into your assistant, then send your photos.')).toHaveAttribute('role', 'status');
  expect(mealShare.sent, 'nothing shared without photos').toBeUndefined();
});

it('with photos, Send to my assistant offers the prompt and the photos to the share sheet, and says it was sent', async () => {
  const page = await open();
  await press(page, 'Choose photos');
  expect(await within(page).findByText('Photos · 2 of 6')).toBeInTheDocument();
  await press(page, 'Send to my assistant');
  expect(mealShare.sent?.photos.length).toBe(2);
  expect(mealShare.sent?.text).toContain('- My photos are attached to this message.');
  expect(clipboard.text, 'copied too, as some assistants keep only the photos').toBe(mealShare.sent?.text);
  expect(await within(page).findByRole('button', { name: 'Sent' })).toBeInTheDocument();
});

it('a clean answer: each food with its group, serving, numbers and evidence line, ticked, and saved with them (MM-710)', async () => {
  const page = await open(withCatalog(await fixtureCatalog()));
  await paste(page, cleanFoodAnswer);
  expect(within(page).getByText('Quest · Snacks and sweets · 1 bar (60 g)')).toBeInTheDocument();
  expect(within(page).getByText(/^Cited by the AI · USDA FoodData Central, FDC ID 1844006/)).toBeInTheDocument();
  expect(within(page).getByText('Dairy and yogurt · 1 cup (227 g)')).toBeInTheDocument();
  expect(within(page).getByText(/^Matched in the app’s foods · Greek yogurt, plain nonfat/)).toBeInTheDocument();
  expect(within(page).getByRole('checkbox', { name: 'Save Chocolate protein bar' })).toBeChecked();
  expect(within(page).getByRole('checkbox', { name: 'Save Greek yogurt, plain nonfat' })).toBeChecked();
  await press(page, 'Save 2 foods');
  expect(await screen.findByText('Saved 2 foods')).toBeInTheDocument();
  const foods = await saved();
  expect(foods.map((f) => [f.name, f.group, f.evidence?.kind, f.servingGrams])).toEqual([
    ['Chocolate protein bar', 'snacksAndSweets', 'cited', 60],
    ['Greek yogurt, plain nonfat', 'dairyAndYogurt', 'matched', 227],
  ]);
  const bar = foods[0] as CustomFood;
  expect(Math.round(bar.perServing.kcal)).toBe(190);
  expect(bar.micros.of('calcium')).toBeCloseTo(199.8, 1);
  expect(bar.madeOf).toEqual([]);
  expect(done?.map((f) => f.id)).toEqual(foods.map((f) => f.id));
});

it('a homemade food lists what went into it, each line removable and one addable, saved as one food', async () => {
  const page = await open();
  await paste(page, homemadeFoodAnswer);
  expect(within(page).getByText('Made of All-purpose flour, Buttermilk, Butter, Baking powder')).toBeInTheDocument();
  await press(page, 'More actions for Buttermilk biscuit');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change' }));
  expect(within(page).getByRole('textbox', { name: 'Ingredient 1' })).toHaveValue('All-purpose flour');
  expect(within(page).getByRole('textbox', { name: 'Ingredient 1 grams' })).toHaveValue('30');
  await press(page, 'Remove ingredient 4');
  await press(page, 'Add an ingredient');
  await typeIn(page, 'Ingredient 4', 'Honey');
  await typeIn(page, 'Ingredient 4 grams', '5');
  await press(page, 'Save changes');
  expect(await within(page).findByText('Made of All-purpose flour, Buttermilk, Butter, Honey')).toBeInTheDocument();
  await press(page, 'Save 1 food');
  expect(await screen.findByText('Saved Buttermilk biscuit')).toBeInTheDocument();
  const [biscuit] = await saved();
  expect(biscuit?.kind).toBe('food');
  expect(biscuit?.madeOf).toEqual([
    { name: 'All-purpose flour', grams: 30 },
    { name: 'Buttermilk', grams: 22 },
    { name: 'Butter', grams: 10 },
    { name: 'Honey', grams: 5 },
  ]);
  expect(biscuit?.evidence?.kind, 'no number was typed, so the numbers are still the estimate').toBe('estimated');
});

it('a number typed makes the numbers the person’s own, and the group can be changed', async () => {
  const page = await open();
  await paste(page, homemadeFoodAnswer);
  await press(page, 'More actions for Buttermilk biscuit');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change' }));
  await typeIn(page, 'Protein g', '7');
  await userEvent.click(within(page).getByRole('button', { name: /^Food group/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'Snacks and sweets' }));
  await press(page, 'Save changes');
  expect(await within(page).findByText('Homemade · Snacks and sweets · 1 biscuit (60 g)')).toBeInTheDocument();
  expect(within(page).getByText('Entered by you')).toBeInTheDocument();
});

it('a problem is said on its food, blocks Save while the food is ticked, and the fixes can be copied back (MM-709)', async () => {
  const page = await open();
  await paste(page, troubledFoodAnswer);
  expect(within(page).getByText('Missing its food group.')).toBeInTheDocument();
  expect(within(page).getByText(/^900 kcal does not agree with the macros/)).toBeInTheDocument();
  await press(page, 'Save 2 foods');
  expect(await within(page).findByRole('alert')).toHaveTextContent('2 ticked foods need fixing or unticking before saving.');
  expect(await saved()).toEqual([]);
  await press(page, 'Copy fixes for AI');
  expect(clipboard.text).toContain('- Food 1, "Pancake": Missing its food group.');
  expect(clipboard.text).toContain('"format": "martian-macros-food"');
  expect(await within(page).findByRole('button', { name: 'Fixes copied' })).toBeInTheDocument();
  await userEvent.click(within(page).getByRole('checkbox', { name: 'Save Pancake' }));
  await userEvent.click(within(page).getByRole('checkbox', { name: 'Save Bacon' }));
  await press(page, 'Save 0 foods');
  expect(await within(page).findByRole('alert')).toHaveTextContent('Tick at least one food to save it.');
});

it('a food of a name already saved offers Update it, which keeps the id and leaves logged entries alone, or Keep both', async () => {
  const id = await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Buttermilk biscuit',
      kind: 'food',
      servingDescription: '1 biscuit',
      servingGrams: 50,
      perServing: new NutritionTotals({ kcal: 180, proteinG: 3, carbsG: 22, fatG: 8 }),
      barcode: gtin14,
    }),
  );
  await repos.food.addFood(new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Buttermilk biscuit', kcal: 180, proteinG: 3, carbsG: 22, fatG: 8, source: 'labelServing' }));
  const page = await open();
  await paste(page, homemadeFoodAnswer);
  const choice = within(page).getByRole('group', { name: 'You have Buttermilk biscuit already' });
  expect(within(choice).getByRole('button', { name: 'Update it' })).toHaveAttribute('aria-pressed', 'true');
  await press(page, 'Save 1 food');
  await screen.findByText('Saved Buttermilk biscuit');
  const [updated, ...others] = await saved();
  expect(others).toEqual([]);
  expect(updated?.id).toBe(id);
  expect(updated?.servingGrams).toBe(60);
  expect(updated?.evidence?.kind).toBe('estimated');
  const [entry] = await first(repos.food.watchFood(today));
  expect(entry?.kcal, 'what was logged is unchanged (MM-45)').toBe(180);
});

it('Keep both saves a second food of the name', async () => {
  await repos.customFoods.saveCustomFood(
    new CustomFood({ id: 0, name: 'Buttermilk biscuit', kind: 'food', servingDescription: '1 biscuit', servingGrams: 50, perServing: new NutritionTotals({ kcal: 180, proteinG: 3, carbsG: 22, fatG: 8 }) }),
  );
  const page = await open();
  await paste(page, homemadeFoodAnswer);
  await userEvent.click(within(page).getByRole('button', { name: 'Keep both' }));
  await press(page, 'Save 1 food');
  await screen.findByText('Saved Buttermilk biscuit');
  expect((await saved()).map((f) => f.servingGrams)).toEqual([50, 60]);
});

it('a barcode scanned goes on the one food of the answer; with several, on none, and the review says so', async () => {
  const page = await open(scannerReading(ean13));
  await press(page, 'Scan the barcode');
  expect(await within(page).findByText(`Scanned: ${gtin14}`)).toBeInTheDocument();
  await paste(page, cleanFoodAnswer);
  expect(within(page).getByText('The scanned barcode was put on no food: the answer has 2 foods. Add it to the right one later, under Edit.')).toBeInTheDocument();
  await press(page, 'Start again');
  await within(page).findByRole('heading', { name: 'About the food' });
  expect(within(page).getByText(`Scanned: ${gtin14}`), 'the barcode is kept across a start again').toBeInTheDocument();
  await paste(page, homemadeFoodAnswer);
  expect(within(page).queryByText(/^The scanned barcode was put on no food/)).not.toBeInTheDocument();
  await press(page, 'Save 1 food');
  await screen.findByText('Saved Buttermilk biscuit');
  expect((await saved())[0]?.barcode).toBe(gtin14);
});

it('text with no food in it says why, and a refused clipboard points to the field', async () => {
  const page = await open();
  await typeIn(page, 'Or paste the answer here', 'Sure, here you go!');
  await press(page, 'Read the answer');
  expect(await within(page).findByText(/^There is no food in this text/)).toBeInTheDocument();
  clipboard.refusesRead = true;
  await press(page, 'Paste from clipboard');
  expect(await within(page).findByText(/^The phone did not hand over the clipboard/)).toBeInTheDocument();
});

it('whatever was handed to the phone to share is deleted when the screen closes (MM-599)', async () => {
  const page = await open();
  await paste(page, homemadeFoodAnswer);
  await press(page, 'Save 1 food');
  await screen.findByText('Saved Buttermilk biscuit');
  expect(mealShare.cleared).toBeGreaterThan(0);
});
