import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryClipboard } from '../../src/fixtures/InMemoryClipboard';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { InMemoryMealShare } from '../../src/fixtures/InMemoryMealShare';
import { InMemoryPhotoLibrary } from '../../src/fixtures/InMemoryPhotoLibrary';
import { mealAnalysisPromptWith } from '../../src/format/mealAnalysisPromptWith';
import { cleanMealAnswer, troubledMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import type { AppServices } from '../../src/state/AppServices';
import { openAddFood, press, typeIn } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-586: AI meal analysis, from Add food to a meal logged; MM-598: offered on Add food, not inside Estimate. */
const today = CalendarDate.of(2026, 10, 22);
let repos: InMemoryRepositories;
let clipboard: InMemoryClipboard;
let mealShare: InMemoryMealShare;
let photoLibrary: InMemoryPhotoLibrary;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  clipboard = new InMemoryClipboard();
  mealShare = new InMemoryMealShare();
  photoLibrary = new InMemoryPhotoLibrary();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** Opens Add food for lunch, then the analysis, with `change` made to the app's services. */
async function open(change: (services: AppServices) => AppServices = (services) => services): Promise<HTMLElement> {
  renderApp(repos, today, { change: (services) => ({ ...change(services), clipboard, mealShare, photoLibrary }) });
  await openTab('Food');
  const sheet = await openAddFood('lunch');
  await press(sheet, 'AI meal analysis');
  await within(sheet).findByRole('heading', { name: 'AI meal analysis' });
  return sheet;
}

/** Puts `text` on the clipboard and pastes it, then waits for the review. */
async function paste(sheet: HTMLElement, text: string): Promise<void> {
  clipboard.text = text;
  await press(sheet, 'Paste from clipboard');
  await within(sheet).findByRole('heading', { name: 'Review the meal' });
}

const logged = async (day = today) => first(repos.food.watchFood(day));

/** The clean answer, eaten at `when` instead, or with no time eaten at all. */
const eaten = (when: string | undefined) =>
  cleanMealAnswer.replace('  "eaten_at": "2026-10-22T19:15",\n', when === undefined ? '' : `  "eaten_at": "${when}",\n`);


it('MM-598: Back returns to Add food, Estimate no longer offers the analysis, and a search hides it', async () => {
  const sheet = await open();
  await press(sheet, 'Back');
  expect(await within(sheet).findByRole('textbox', { name: 'Search foods' }), 'the first view').toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'AI meal analysis' }), 'offered there').toBeInTheDocument();
  await typeIn(sheet, 'Search foods', 'zzqx');
  expect(within(sheet).queryByRole('button', { name: 'AI meal analysis' }), 'hidden while searching').not.toBeInTheDocument();
  await typeIn(sheet, 'Search foods', '');
  await press(sheet, 'Estimate');
  await within(sheet).findByRole('heading', { name: 'Estimate a meal' });
  expect(within(sheet).queryByRole('button', { name: 'AI meal analysis' }), 'Estimate is the hand estimate alone').not.toBeInTheDocument();
});

it('MM-599: the questions come first, and nothing is copied until the meal has a name', async () => {
  const sheet = await open();
  for (const field of ['Meal name', 'Anything you didn’t eat?', 'Brand or restaurant']) {
    expect(within(sheet).getByRole('textbox', { name: field })).toBeInTheDocument();
  }
  expect(within(sheet).getByRole('group', { name: 'How much did you eat?' })).toBeInTheDocument();
  expect(within(sheet).getByRole('group', { name: 'Eaten on' })).toHaveTextContent('Today');
  await press(sheet, 'Copy prompt');
  expect(await within(sheet).findByText('The meal needs a name.')).toBeInTheDocument();
  expect(clipboard.text, 'nothing copied').toBeUndefined();
});

it('MM-599: with no photos, Copy prompt puts the prompt with the answers on the clipboard, and says the photos follow', async () => {
  const sheet = await open();
  await typeIn(sheet, 'Meal name', 'Taco night');
  await press(sheet, 'Most');
  await typeIn(sheet, 'Brand or restaurant', 'Chipotle');
  await press(sheet, 'Copy prompt');
  const prompt = mealAnalysisPromptWith(
    { name: 'Taco night', eaten: 'most', notEaten: '', from: 'Chipotle', day: today, eatenAt: 12 * 60, photosAttached: false },
    today,
  );
  expect(clipboard.text).toBe(prompt);
  expect(prompt).toContain('- The meal is called "Taco night".');
  expect(prompt).toContain('- I ate most of what is shown.');
  expect(prompt).toContain('- It is from Chipotle.');
  expect(prompt).toContain('Use "eaten_at": "2026-10-22T12:00".');
  expect(prompt).toContain('- Today is Thursday, October 22, 2026.');
  expect(prompt).toContain('I will send my photos in my next message.');
  expect(prompt, 'the assistant is not told to ask').not.toContain('Before you answer, ask me');
  expect(await within(sheet).findByRole('button', { name: 'Prompt copied' }), 'the button says so, with a check').toBeInTheDocument();
  expect(within(sheet).getByText('Copied. Paste it into your assistant, then send your photos.'), 'and a screen reader hears it').toHaveAttribute('role', 'status');
  expect(mealShare.sent, 'nothing shared without photos').toBeUndefined();
});

it('a phone that refuses to copy says so', async () => {
  clipboard.refusesWrite = true;
  const sheet = await open();
  await typeIn(sheet, 'Meal name', 'Taco night');
  await press(sheet, 'Copy prompt');
  expect(await within(sheet).findByText('The phone did not allow copying. Press the button again.')).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Copy prompt' }), 'nothing was copied').toBeInTheDocument();
});

it('MM-599: photos chosen are sent with the prompt in one share, the prompt copied too, and nothing kept once the sheet closes', async () => {
  const sheet = await open();
  await typeIn(sheet, 'Meal name', 'Taco night');
  await press(sheet, 'Choose photos');
  expect(await within(sheet).findByText('Photos · 2 of 6')).toBeInTheDocument();
  expect(photoLibrary.asked, 'asked for as many as are left').toEqual([6]);
  await press(sheet, 'Remove photo 2');
  expect(within(sheet).getByText('Photos · 1 of 6')).toBeInTheDocument();
  await press(sheet, 'Send to assistant');
  expect(await within(sheet).findByRole('button', { name: 'Sent' })).toBeInTheDocument();
  expect(mealShare.sent?.photos).toHaveLength(1);
  expect(mealShare.sent?.text).toContain('My photos are attached to this message.');
  expect(clipboard.text, 'the prompt is on the clipboard too').toBe(mealShare.sent?.text);
  await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
  await expect.poll(() => mealShare.cleared).toBeGreaterThan(0);
  expect(mealShare.sent, 'what was handed on is deleted').toBeUndefined();
});

it('MM-599: a photo taken in the sheet joins the meal', async () => {
  const sheet = await open();
  await press(sheet, 'Take a photo');
  await within(sheet).findByRole('heading', { name: 'Take a photo' });
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Take photo' }));
  expect(await within(sheet).findByText('1 photo taken.')).toBeInTheDocument();
  await press(sheet, 'Done');
  expect(await within(sheet).findByText('Photos · 1 of 6')).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Send to assistant' })).toBeInTheDocument();
});

it('MM-599: a phone that cannot share copies the prompt and says to attach the photos in the assistant', async () => {
  mealShare = new InMemoryMealShare({ available: false });
  const sheet = await open();
  await typeIn(sheet, 'Meal name', 'Taco night');
  await press(sheet, 'Choose photos');
  expect(await within(sheet).findByText(/^This phone cannot hand photos to another app/)).toBeInTheDocument();
  await press(sheet, 'Copy prompt');
  expect(clipboard.text).toContain('I will send my photos in my next message.');
});

it('MM-599: the day given here is the review’s when the answer has no time', async () => {
  const sheet = await open();
  await userEvent.click(within(within(sheet).getByRole('group', { name: 'Eaten on' })).getByRole('button', { name: 'Previous day' }));
  await paste(sheet, eaten(undefined));
  expect(within(sheet).getByRole('group', { name: 'Logged on' })).toHaveTextContent('Yesterday');
});

it('a clean answer is reviewed, and logged to lunch at the time it says as one meal, each food saying where its numbers came from', async () => {
  const sheet = await open();
  await paste(sheet, cleanMealAnswer);
  expect(within(sheet).getByRole('textbox', { name: 'Meal name' })).toHaveValue('Chicken and rice');
  expect(within(sheet).getByText(/^Cited by the AI · USDA FoodData Central, FDC ID 171477/)).toBeInTheDocument();
  expect(within(sheet).getByText('AI estimate, unverified · USDA')).toBeInTheDocument();
  expect(within(sheet).getByText(/^Logs about 522 kcal/)).toBeInTheDocument();
  await press(sheet, 'Log meal');
  await expect.poll(async () => (await logged()).length).toBe(3);
  const foods = await logged();
  expect(foods.map((f) => f.name)).toEqual(['Grilled chicken breast', 'White rice', 'Steamed broccoli']);
  expect(new Set(foods.map((f) => f.loggedMeal?.key)).size, 'one key').toBe(1);
  // MM-594: eaten at 19:15, as the person told the assistant; the slot stays the one Add food was opened for.
  expect(foods.every((f) => f.loggedMeal?.name === 'Chicken and rice' && f.meal === 'lunch' && f.eatenAt === 19 * 60 + 15)).toBe(true);
  expect(foods.map((f) => f.source)).toEqual(['photoEstimate', 'photoEstimate', 'photoEstimate']);
  expect(foods.map((f) => f.evidence?.kind)).toEqual(['cited', 'estimated', 'estimated']);
  expect(await screen.findByText('Logged Chicken and rice')).toBeInTheDocument();
});

it('a food without a specific source is looked up in the app’s foods, and kept as an estimate when nothing matches', async () => {
  const catalog = await fixtureCatalog();
  const sheet = await open(withCatalog(catalog));
  await paste(sheet, cleanMealAnswer);
  // "rice white cooked" finds the pack's "White rice, cooked" (130 kcal per 100 g), scaled to 186 g.
  expect(within(sheet).getByText(/^Matched in the app’s foods · White rice, cooked/)).toBeInTheDocument();
  expect(within(sheet).getByText(/^186 g · 242 kcal/)).toBeInTheDocument();
  // "broccoli cooked" finds nothing (the pack has it raw only).
  expect(within(sheet).getByText('AI estimate, unverified · USDA')).toBeInTheDocument();
  await press(sheet, 'Log meal');
  await expect.poll(async () => (await logged()).length).toBe(3);
  const rice = (await logged()).find((f) => f.name === 'White rice');
  expect(rice?.evidence?.kind).toBe('matched');
  expect(rice?.kcal).toBeCloseTo(241.8, 6);
  expect(rice?.fiberG, 'what the pack does not state keeps the assistant’s').toBe(0.6);
});

it('also saving to Saved saves the meal as a recipe of its foods', async () => {
  const sheet = await open();
  await paste(sheet, cleanMealAnswer);
  await userEvent.click(within(sheet).getByRole('checkbox', { name: 'Also save to Saved' }));
  await press(sheet, 'Log meal');
  await expect.poll(async () => (await first(repos.customFoods.watchCustomFoods())).length).toBe(1);
  const [recipe] = await first(repos.customFoods.watchCustomFoods());
  expect(recipe?.kind).toBe('recipe');
  expect(recipe?.name).toBe('Chicken and rice');
  expect(recipe?.ingredients.map((i) => [i.name, i.grams])).toEqual([
    ['Grilled chicken breast', 150],
    ['White rice', 186],
    ['Steamed broccoli', 90],
  ]);
  expect(recipe?.perServing.kcal).toBe(522);
});

it('problems are said on their foods and keep the meal from being logged; the fixes go back to the assistant', async () => {
  const sheet = await open();
  await paste(sheet, troubledMealAnswer);
  expect(within(sheet).getByText('Missing total sugars, saturated fat, sodium.')).toBeInTheDocument();
  expect(within(sheet).getByText(/^900 kcal does not agree with the macros/)).toBeInTheDocument();
  await press(sheet, 'Log meal');
  expect(await within(sheet).findByText('2 foods need fixing or removing before the meal can be logged.')).toBeInTheDocument();
  expect(await logged()).toEqual([]);
  await press(sheet, 'Copy fixes for AI');
  expect(clipboard.text).toContain('- Item 1, "Pancakes": Missing total sugars, saturated fat, sodium.');
  expect(clipboard.text).toContain('"name": "Diner breakfast"');
  // The corrected answer replaces the preview.
  clipboard.text = cleanMealAnswer;
  await press(sheet, 'Paste from clipboard');
  expect(await within(sheet).findByDisplayValue('Chicken and rice')).toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'Copy fixes for AI' })).toBeNull();
});

it('a food removed from the preview is not logged; one fixed by hand is, as the person’s own', async () => {
  const sheet = await open();
  await paste(sheet, troubledMealAnswer);
  await press(sheet, 'More actions for Bacon');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
  await press(sheet, 'More actions for Pancakes');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change' }));
  await typeIn(sheet, 'Sugars g', '8');
  await typeIn(sheet, 'Sat. fat g', '2');
  await typeIn(sheet, 'Sodium mg', '640');
  await press(sheet, 'Save food');
  expect(within(sheet).getByText('Entered by you')).toBeInTheDocument();
  await press(sheet, 'Log meal');
  await expect.poll(async () => (await logged()).length).toBe(1);
  const [pancakes] = await logged();
  expect(pancakes?.name).toBe('Pancakes');
  expect(pancakes?.micros.of('sodium')).toBe(640);
  expect(pancakes?.evidence?.kind).toBe('yours');
});

it('changing a food’s grams scales its numbers and keeps its source', async () => {
  const sheet = await open();
  await paste(sheet, cleanMealAnswer);
  await press(sheet, 'More actions for Grilled chicken breast');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change' }));
  await typeIn(sheet, 'Grams eaten', '75');
  expect(within(sheet).getByRole('textbox', { name: 'Calories' })).toHaveValue('124');
  await press(sheet, 'Save food');
  expect(within(sheet).getByText(/^75 g · 124 kcal/)).toBeInTheDocument();
  expect(within(sheet).getByText(/^Cited by the AI/)).toBeInTheDocument();
});

it('a meal with no name is not logged until it has one', async () => {
  const sheet = await open();
  await paste(sheet, cleanMealAnswer);
  await typeIn(sheet, 'Meal name', '');
  await press(sheet, 'Log meal');
  expect(await within(sheet).findByText('Give the meal a name to log it.')).toBeInTheDocument();
  expect(await logged()).toEqual([]);
});

it('text that holds no meal says why, and so does a clipboard the phone will not hand over', async () => {
  const sheet = await open();
  await typeIn(sheet, 'Or paste the answer here', 'What should I call this meal?');
  await press(sheet, 'Read the answer');
  expect(await within(sheet).findByText(/^There is no meal in this text/)).toBeInTheDocument();
  clipboard.text = cleanMealAnswer;
  clipboard.refusesRead = true;
  await press(sheet, 'Paste from clipboard');
  expect(await within(sheet).findByText(/^The phone did not hand over the clipboard/)).toBeInTheDocument();
});

// MM-591: a meal that could not be logged said nothing at all.
it('MM-591: a meal that cannot be logged says so, logs nothing, and keeps the review', async () => {
  const sheet = await open((services) => {
    const food = Object.create(services.food) as AppServices['food'];
    food.addFood = () => Promise.reject(new Error('The disk is full.'));
    return { ...services, food };
  });
  await paste(sheet, cleanMealAnswer);
  await press(sheet, 'Log meal');
  expect(await within(sheet).findByText(/^The meal could not be logged, so nothing was/)).toBeInTheDocument();
  expect(within(sheet).getByRole('heading', { name: 'Review the meal' })).toBeInTheDocument();
  expect(await logged()).toEqual([]);
});

// MM-594: the day and time the person told the assistant go with the meal; without them, the day opened and now.
it('MM-594: a meal eaten yesterday is logged on yesterday, at the time the answer says', async () => {
  const sheet = await open();
  await paste(sheet, eaten('2026-10-21T18:45'));
  expect(within(sheet).getByRole('group', { name: 'Logged on' })).toHaveTextContent('Yesterday');
  await press(sheet, 'Log meal');
  await expect.poll(async () => (await logged(today.addDays(-1))).length).toBe(3);
  expect((await logged(today.addDays(-1))).every((f) => f.eatenAt === 18 * 60 + 45)).toBe(true);
  expect(await logged()).toEqual([]);
});

it('MM-594: an answer with no time eaten is logged on the day opened, at now', async () => {
  const sheet = await open();
  await paste(sheet, eaten(undefined));
  await press(sheet, 'Log meal');
  await expect.poll(async () => (await logged()).length).toBe(3);
  expect((await logged()).every((f) => f.eatenAt === 12 * 60)).toBe(true);
});

it('MM-594: a day after today is not taken; its time is', async () => {
  const sheet = await open();
  await paste(sheet, eaten('2026-10-23T08:00'));
  await press(sheet, 'Log meal');
  await expect.poll(async () => (await logged()).length).toBe(3);
  expect((await logged()).every((f) => f.eatenAt === 8 * 60)).toBe(true);
});
