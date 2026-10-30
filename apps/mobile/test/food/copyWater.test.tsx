import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { WaterUnits } from '../../src/domain/water/WaterUnits';
import { FakeDataRestorer } from '../../src/fixtures/FakeDataRestorer';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { FakeMoveReceiver } from '../../src/transfer/FakeMoveReceiver';
import { FakeMoveSender } from '../../src/transfer/FakeMoveSender';
import { foodCopyBytes } from '../../src/transfer/foodCopyBytes';
import { foodCopyOfBytes } from '../../src/transfer/foodCopyOfBytes';
import { MoveCode } from '../../src/transfer/MoveCode';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { pickDate } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-718: a drink of water's menu copies it to another day, as a food's does, and to the other phone by the move's
 * flow (MM-715), with the moment it was had; the other phone confirms what came, water alone or with foods, adds
 * it on its day with Undo.
 */
const slowly = { timeout: 15000 };
const today = CalendarDate.of(2026, 10, 30);
const yesterday = today.addDays(-1);
const code = new MoveCode({ host: '192.168.1.24', port: 47_310 }, new Uint8Array(32).fill(3)).toText();
const glass = WaterUnits.flOzToMl(8);
const at = (day: CalendarDate, hour: number) => new Date(day.year, day.month - 1, day.day, hour);

let repos: InMemoryRepositories;
let sender: FakeMoveSender;
let receiver: FakeMoveReceiver;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'imperial' }));
  await repos.weights.saveWeight(today, 82);
  await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml: glass, at: at(today, 8) }));
  sender = new FakeMoveSender();
  receiver = new FakeMoveReceiver();
});

const render = (base = repos) =>
  renderApp(base, today, {
    change: (services: AppServices) => {
      const restorer = new FakeDataRestorer();
      restorer.here = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };
      return { ...services, restorer, moveSender: sender, moveReceiver: receiver, codeScanner: { scanCode: async () => code } };
    },
  });

const water = (base: InMemoryRepositories, date: CalendarDate) => first(base.water.watchWater(date));
const logged = (base: InMemoryRepositories, date: CalendarDate) => first(base.food.watchFood(date));

const openDrinkMenu = async () => {
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'More actions for 8 fl oz of water at 8:00 AM' }));
};

it('MM-718: a drink’s menu offers the copies a food’s does, then Delete', async () => {
  render();
  await openDrinkMenu();
  expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Copy to another day', 'Copy to another phone', 'Delete']);
});

it('MM-718: Copy to another day logs the amount on the day picked, now, with Undo; the original is kept', async () => {
  render();
  await openDrinkMenu();
  await userEvent.click(screen.getByRole('menuitem', { name: 'Copy to another day' }));
  expect(await screen.findByText('Copy 8 fl oz of water at 8:00 AM to')).toBeInTheDocument();
  await pickDate(yesterday.toString());
  await expect.poll(async () => (await water(repos, yesterday)).map((drink) => drink.ml)).toEqual([glass]);
  const copy = (await water(repos, yesterday))[0];
  // Logged at the moment it was copied (noon today), so yesterday's row says "Added later" (MM-319), as a food's copy has no time (MM-633).
  expect(copy?.at.getDate()).toBe(today.day);
  expect((await water(repos, today)).map((drink) => drink.at.getHours())).toEqual([8]);
  expect(await screen.findByText('Copied 8 fl oz of water to yesterday')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await water(repos, yesterday)).length).toBe(0);
});

it('MM-718: Copy to another phone sends the drink with the moment it was had; this phone keeps its own', async () => {
  render();
  await openDrinkMenu();
  await userEvent.click(screen.getByRole('menuitem', { name: 'Copy to another phone' }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Sending to your other phone' }, slowly));
  await sheet.findByRole('heading', { name: 'Sent' }, slowly);
  expect(sheet.getByText('Your other phone has the water. Confirm there to add it; this phone keeps its own.')).toBeInTheDocument();
  const parcel = sender.sent[0]?.parcel;
  if (parcel?.kind !== 'foods') throw new Error(`Expected a copy, got ${parcel?.kind}.`);
  const copy = foodCopyOfBytes(parcel.foods);
  expect(copy?.day).toBe(today);
  expect(copy?.entries).toEqual([]);
  expect(copy?.foods).toEqual([]);
  expect(copy?.water.map((drink) => [drink.date, drink.ml, drink.at.getTime()])).toEqual([[today, glass, at(today, 8).getTime()]]);
  expect(await water(repos, today)).toHaveLength(1);
});

/** The other phone, with nothing of ours, receiving `bytes` from Settings > Backup. */
async function otherPhone(bytes: Uint8Array) {
  const other = new InMemoryRepositories();
  await other.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'imperial' }));
  receiver = new FakeMoveReceiver({ kind: 'receives', parcel: { kind: 'foods', foods: bytes } });
  render(other);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Move to another phone/ }));
  const choice = within(await screen.findByRole('dialog', { name: 'Move to another phone' }, slowly));
  await userEvent.click(choice.getByRole('button', { name: /^Receive on this phone/ }));
  return other;
}

it('MM-718: water that arrived is said, confirmed and added on its day at its moments, and Undo takes it back', async () => {
  const drinks = [new WaterEntry({ id: 3, date: yesterday, ml: glass, at: at(yesterday, 8) }), new WaterEntry({ id: 4, date: yesterday, ml: glass, at: at(yesterday, 15) })];
  const other = await otherPhone(foodCopyBytes({ day: yesterday, entries: [], water: drinks, foods: [] }));
  const asks = within(await screen.findByRole('dialog', { name: 'Add water from your other phone?' }, slowly));
  expect(asks.getByText(/Your other phone sent 16 fl oz of water in 2 drinks yesterday\./)).toBeInTheDocument();
  expect(asks.getByText(/They are added to this phone, on that day\. Nothing here is replaced\./)).toBeInTheDocument();
  await userEvent.click(asks.getByRole('button', { name: 'Add' }));
  await expect.poll(async () => (await water(other, yesterday)).map((drink) => [drink.ml, drink.at.getHours()])).toEqual([
    [glass, 8],
    [glass, 15],
  ]);
  expect(await water(other, today), 'nothing on other days').toHaveLength(0);
  expect(screen.getByText('Added 16 fl oz of water from your other phone')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await water(other, yesterday)).length).toBe(0);
});

it('MM-718: foods and water together are said as both, and both are added', async () => {
  const bytes = foodCopyBytes({
    day: yesterday,
    entries: [foodOn(yesterday, { name: 'Rice', meal: 'dinner', kcal: 200, eatenAt: 19 * 60 })],
    water: [new WaterEntry({ id: 0, date: yesterday, ml: glass, at: at(yesterday, 20) })],
    foods: [],
  });
  const other = await otherPhone(bytes);
  const asks = within(await screen.findByRole('dialog', { name: 'Add foods and water from your other phone?' }, slowly));
  expect(asks.getByText(/Your other phone sent 1 food for dinner and 8 fl oz of water yesterday: Rice\./)).toBeInTheDocument();
  await userEvent.click(asks.getByRole('button', { name: 'Add' }));
  await expect.poll(async () => (await logged(other, yesterday)).map((entry) => [entry.name, entry.eatenAt])).toEqual([['Rice', 19 * 60]]);
  expect((await water(other, yesterday)).map((drink) => drink.ml)).toEqual([glass]);
  expect(screen.getByText('Added 1 food and 8 fl oz of water from your other phone')).toBeInTheDocument();
});
