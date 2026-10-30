import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { FakeDataRestorer } from '../../src/fixtures/FakeDataRestorer';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { FakeMoveReceiver } from '../../src/transfer/FakeMoveReceiver';
import { FakeMoveSender } from '../../src/transfer/FakeMoveSender';
import { foodCopyBytes } from '../../src/transfer/foodCopyBytes';
import { foodCopyOfBytes } from '../../src/transfer/foodCopyOfBytes';
import { MoveCode } from '../../src/transfer/MoveCode';
import type { MoveParcel } from '../../src/transfer/MoveParcel';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-715: "Copy to another phone" on a food, a logged meal, a meal and the chosen foods sends fresh copies with
 * their Library foods by the move's flow; the other phone confirms, adds them on the same day and meal, asks
 * whether to keep the Library foods, and offers Undo.
 */
const slowly = { timeout: 15000 };
const today = CalendarDate.of(2026, 10, 30);
const yesterday = today.addDays(-1);
const code = new MoveCode({ host: '192.168.1.24', port: 47_310 }, new Uint8Array(32).fill(3)).toText();

const momsSalmon = (id: number) =>
  new CustomFood({
    id,
    name: 'Mom’s salmon',
    kind: 'food',
    servingDescription: '1 fillet',
    servingGrams: 150,
    perServing: new NutritionTotals({ kcal: 400, proteinG: 40, carbsG: 0, fatG: 26 }),
    group: 'fish',
  });

/** Salmon logged from the Library food `foodId`, at dinner on `date`. */
const salmonFrom = (foodId: number, date: CalendarDate, eatenAt?: number) =>
  new FoodEntry({
    id: 0,
    date,
    meal: 'dinner',
    name: 'Mom’s salmon',
    kcal: 400,
    proteinG: 40,
    carbsG: 0,
    fatG: 26,
    source: 'labelServing',
    eatenAt,
    portion: { method: 'labelServing', basis: 'calculated', quantity: 1, unit: 'serving', origin: { packId: 'custom', foodId, source: 'user' } },
  });

let repos: InMemoryRepositories;
let sender: FakeMoveSender;
let receiver: FakeMoveReceiver;
let momId: number;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  momId = await repos.customFoods.saveCustomFood(momsSalmon(0));
  await repos.food.addFood(salmonFrom(momId, today, 19 * 60));
  await repos.food.addFood(foodOn(today, { name: 'Rice', meal: 'dinner', kcal: 200, eatenAt: 19 * 60 + 10 }));
  sender = new FakeMoveSender();
  receiver = new FakeMoveReceiver();
});

const render = (base = repos) =>
  renderApp(base, today, {
    change: (services: AppServices) => {
      // A phone with nothing a backup lacks: no nudge before the code.
      const restorer = new FakeDataRestorer();
      restorer.here = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };
      return { ...services, restorer, moveSender: sender, moveReceiver: receiver, codeScanner: { scanCode: async () => code } };
    },
  });

const logged = (base: InMemoryRepositories, date: CalendarDate) => first(base.food.watchFood(date));
const library = (base: InMemoryRepositories) => first(base.customFoods.watchCustomFoods());

/** What the fake sender was given, read as the other phone would read it. */
const sentCopy = () => {
  const parcel = sender.sent[0]?.parcel;
  if (parcel?.kind !== 'foods') throw new Error(`Expected a copy of foods, got ${parcel?.kind}.`);
  const copy = foodCopyOfBytes(parcel.foods);
  if (copy === undefined) throw new Error('The copy sent does not read.');
  return copy;
};

const sentSheet = async () => {
  const sheet = within(await screen.findByRole('dialog', { name: 'Sending to your other phone' }, slowly));
  await sheet.findByRole('heading', { name: 'Sent' }, slowly);
  return sheet;
};

it('MM-715: a food’s menu sends a fresh copy for the same day and meal, with the Library food it came from; this phone keeps its own', async () => {
  render();
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'More actions for Mom’s salmon' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy to another phone' }));
  const sheet = await sentSheet();
  expect(sheet.getByText('Your other phone has the foods. Confirm there to add them; this phone keeps its own.')).toBeInTheDocument();
  const copy = sentCopy();
  expect(copy.day).toBe(today);
  expect(copy.entries).toHaveLength(1);
  expect(copy.entries[0]).toMatchObject({ id: 0, name: 'Mom’s salmon', meal: 'dinner', kcal: 400, eatenAt: undefined });
  expect(copy.entries[0]?.date).toBe(today);
  expect(copy.entries[0]?.portion?.origin).toMatchObject({ packId: 'custom', foodId: momId });
  expect(copy.foods.map((food) => [food.id, food.name])).toEqual([[momId, 'Mom’s salmon']]);
  const here = await logged(repos, today);
  expect(here.map((entry) => [entry.name, entry.eatenAt])).toEqual([
    ['Mom’s salmon', 19 * 60],
    ['Rice', 19 * 60 + 10],
  ]);
});

it('MM-715: the chosen foods’ dialog offers it too, and sends every chosen food with the Library foods among them once', async () => {
  render();
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'More actions for Rice' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Select' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Mom’s salmon · 400 kcal' }));
  await userEvent.click(screen.getByRole('button', { name: 'Change 2 foods' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Change time',
    'Move to another meal',
    'Move to another day',
    'Copy to another meal',
    'Copy to another day',
    'Copy to another phone',
    'Delete',
  ]);
  await userEvent.click(within(dialog).getByRole('option', { name: 'Copy to another phone' }));
  await sentSheet();
  const copy = sentCopy();
  expect(copy.entries.map((entry) => entry.name).sort()).toEqual(['Mom’s salmon', 'Rice']);
  expect(copy.foods).toHaveLength(1);
});

/** The other phone: nothing of ours yet, unless a test puts it there; its code shown from Settings > Backup. */
async function otherPhone({ already = false, parcel }: { already?: boolean; parcel?: MoveParcel } = {}) {
  const other = new InMemoryRepositories();
  await other.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  if (already) await other.customFoods.saveCustomFood(momsSalmon(0));
  const copy = foodCopyBytes({ day: yesterday, entries: [salmonFrom(42, yesterday), foodOn(yesterday, { name: 'Rice', meal: 'dinner', kcal: 200 })], foods: [momsSalmon(42)] });
  receiver = new FakeMoveReceiver({ kind: 'receives', parcel: parcel ?? { kind: 'foods', foods: copy } });
  render(other);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Move to another phone/ }));
  const choice = within(await screen.findByRole('dialog', { name: 'Move to another phone' }, slowly));
  await userEvent.click(choice.getByRole('button', { name: /^Receive on this phone/ }));
  return other;
}

/** Reads what the dialog named `title` says (`says` must be in it), then presses `button`. */
const answer = async (title: string, button: string, says?: RegExp) => {
  const asks = within(await screen.findByRole('dialog', { name: title }, slowly));
  if (says !== undefined) expect(asks.getByText(says)).toBeInTheDocument();
  await userEvent.click(asks.getByRole('button', { name: button }));
};

it('MM-715: what arrived is said and confirmed, added on its day and meal, its Library food saved when asked for, and Undo takes all of it back', async () => {
  const other = await otherPhone();
  const asks = within(await screen.findByRole('dialog', { name: 'Add foods from your other phone?' }, slowly));
  expect(asks.getByText(/Your other phone sent 2 foods for dinner yesterday: Mom’s salmon and Rice\./)).toBeInTheDocument();
  expect(asks.getByText(/Nothing here is replaced\./)).toBeInTheDocument();
  await userEvent.click(asks.getByRole('button', { name: 'Add' }));
  await answer('Save it to your Library?', 'Save', /Mom’s salmon came from your other phone’s Library/);
  await expect.poll(async () => (await logged(other, yesterday)).map((entry) => entry.name)).toEqual(['Mom’s salmon', 'Rice']);
  const saved = await library(other);
  expect(saved.map((food) => food.name)).toEqual(['Mom’s salmon']);
  const salmon = (await logged(other, yesterday)).find((entry) => entry.name === 'Mom’s salmon');
  expect(salmon?.portion?.origin?.foodId, 'linked to this phone’s own copy').toBe(saved[0]?.id);
  expect(salmon?.meal).toBe('dinner');
  expect(salmon?.eatenAt).toBeUndefined();
  expect(await logged(other, today), 'nothing on other days').toHaveLength(0);
  expect(screen.getByText('Added 2 foods from your other phone, and 1 food to your Library')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await logged(other, yesterday)).length).toBe(0);
  expect(await library(other)).toHaveLength(0);
});

it('MM-715: the Library declined, the foods are added from no saved food and the Library is unchanged', async () => {
  const other = await otherPhone();
  await answer('Add foods from your other phone?', 'Add');
  await answer('Save it to your Library?', 'Not now');
  await expect.poll(async () => (await logged(other, yesterday)).length).toBe(2);
  const salmon = (await logged(other, yesterday)).find((entry) => entry.name === 'Mom’s salmon');
  expect(salmon?.portion?.origin).toBeUndefined();
  expect(salmon?.portion?.quantity, 'the rest of the portion stays').toBe(1);
  expect(await library(other)).toHaveLength(0);
  expect(screen.getByText('Added 2 foods from your other phone')).toBeInTheDocument();
});

it('MM-715: a Library food this phone already has by name is kept, not duplicated, and the arriving food is logged from it', async () => {
  const other = await otherPhone({ already: true });
  const mine = (await library(other))[0];
  await answer('Add foods from your other phone?', 'Add');
  await answer('Save it to your Library?', 'Save', /You already have Mom’s salmon; yours is kept as it is\./);
  await expect.poll(async () => (await logged(other, yesterday)).length).toBe(2);
  expect(await library(other)).toHaveLength(1);
  const salmon = (await logged(other, yesterday)).find((entry) => entry.name === 'Mom’s salmon');
  expect(salmon?.portion?.origin?.foodId).toBe(mine?.id);
  expect(screen.getByText('Added 2 foods from your other phone')).toBeInTheDocument();
});

it('MM-715: Cancel on what arrived changes nothing', async () => {
  const other = await otherPhone();
  await answer('Add foods from your other phone?', 'Cancel');
  expect(await logged(other, yesterday)).toHaveLength(0);
  expect(await library(other)).toHaveLength(0);
});

it('MM-715: a copy that does not read is refused whole', async () => {
  const other = await otherPhone({ parcel: { kind: 'foods', foods: new TextEncoder().encode('{"format":"something else"}') } });
  expect(await screen.findByText('What arrived could not be read. Nothing on this phone was changed.', {}, slowly)).toBeInTheDocument();
  expect(await logged(other, yesterday)).toHaveLength(0);
});
