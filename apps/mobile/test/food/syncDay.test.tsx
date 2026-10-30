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
import { renderApp } from '../support/renderApp';

/**
 * MM-719: "Sync this day to another phone", a row after the meals on a day with anything logged, sends the whole day
 * (foods with their times, water, marks) by the move's flow; the other phone says what it holds and what it will
 * replace, and once confirmed makes its day match, with Undo.
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

const phone = async () => {
  const base = new InMemoryRepositories();
  await base.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'imperial' }));
  await base.weights.saveWeight(today, 82);
  return base;
};

beforeEach(async () => {
  repos = await phone();
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
const syncRow = () => screen.queryByRole('button', { name: /^Sync this day to another phone/ });

it('MM-719: the row stands above the day’s mark once anything is logged, food or water, and not on an empty day', async () => {
  render();
  await openTab('Food');
  await screen.findByRole('button', { name: /^Mark a refeed or a day off/ });
  expect(syncRow(), 'nothing logged').toBeNull();
  await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml: glass, at: at(today, 8) }));
  const row = await screen.findByRole('button', { name: /^Sync this day to another phone/ });
  expect(row).toHaveTextContent('Its foods, water and marks; your other phone’s day becomes this one.');
  const mark = screen.getByRole('button', { name: /^Mark a refeed or a day off/ });
  expect(row.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING, 'above the mark row').toBeTruthy();
});

it('MM-719: pressing it sends the whole day: foods with their times, water with its moments, and the marks', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 400, eatenAt: 7 * 60 + 30 }));
  await repos.food.addFood(foodOn(today, { name: 'Rice', meal: 'dinner', kcal: 200, eatenAt: 19 * 60 }));
  await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml: glass, at: at(today, 8) }));
  await repos.dayKinds.setDayKind(today, 'refeed');
  await repos.dayMarks.setCompleteness(today, 'complete');
  render();
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: /^Sync this day to another phone/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Sending to your other phone' }, slowly));
  await sheet.findByRole('heading', { name: 'Sent' }, slowly);
  expect(sheet.getByText('Your other phone has this day. Confirm there to make its day match; this phone keeps its own.')).toBeInTheDocument();
  const parcel = sender.sent[0]?.parcel;
  if (parcel?.kind !== 'foods') throw new Error(`Expected a day, got ${parcel?.kind}.`);
  const copy = foodCopyOfBytes(parcel.foods);
  expect(copy?.day).toBe(today);
  expect(copy?.whole).toEqual({ kind: 'refeed', completeness: 'complete' });
  expect(copy?.entries.map((entry) => [entry.id, entry.name, entry.meal, entry.eatenAt])).toEqual([
    [0, 'Oats', 'breakfast', 7 * 60 + 30],
    [0, 'Rice', 'dinner', 19 * 60],
  ]);
  expect(copy?.water.map((drink) => [drink.ml, drink.at.getTime()])).toEqual([[glass, at(today, 8).getTime()]]);
  expect(await logged(repos, today), 'this phone keeps its own').toHaveLength(2);
});

/** The other phone, holding `then` sets up for yesterday, receiving `bytes` from Settings > Backup. */
async function otherPhone(bytes: Uint8Array, then: (other: InMemoryRepositories) => Promise<void> = async () => undefined) {
  const other = await phone();
  await then(other);
  receiver = new FakeMoveReceiver({ kind: 'receives', parcel: { kind: 'foods', foods: bytes } });
  render(other);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Move to another phone/ }));
  const choice = within(await screen.findByRole('dialog', { name: 'Move to another phone' }, slowly));
  await userEvent.click(choice.getByRole('button', { name: /^Receive on this phone/ }));
  return other;
}

const sentDay = () =>
  foodCopyBytes({
    day: yesterday,
    entries: [foodOn(yesterday, { name: 'Oats', meal: 'breakfast', kcal: 400, eatenAt: 7 * 60 + 30 }), foodOn(yesterday, { name: 'Rice', meal: 'dinner', kcal: 200, eatenAt: 19 * 60 })],
    water: [new WaterEntry({ id: 0, date: yesterday, ml: glass, at: at(yesterday, 8) }), new WaterEntry({ id: 0, date: yesterday, ml: glass, at: at(yesterday, 15) })],
    foods: [],
    whole: { kind: 'refeed', completeness: 'complete' },
  });

it('MM-719: what arrived and what is replaced are said; Sync makes this phone’s day match, and Undo puts its own back', async () => {
  const other = await otherPhone(sentDay(), async (base) => {
    await base.food.addFood(foodOn(yesterday, { name: 'Toast', meal: 'breakfast', kcal: 150, eatenAt: 8 * 60 }));
    await base.water.addWater(new WaterEntry({ id: 0, date: yesterday, ml: glass * 2, at: at(yesterday, 9) }));
    await base.dayKinds.setDayKind(yesterday, 'dayOff');
  });
  const asks = within(await screen.findByRole('dialog', { name: 'Sync this day from your other phone?' }, slowly));
  expect(asks.getByText(/Your other phone sent its whole day for yesterday: 2 foods, 16 fl oz of water, a refeed mark and marked complete\./)).toBeInTheDocument();
  expect(asks.getByText(/This phone’s yesterday holds 1 food, 16 fl oz of water and a day off mark now; the day sent replaces that\. Undo puts it back\./)).toBeInTheDocument();
  await userEvent.click(asks.getByRole('button', { name: 'Sync' }));
  await expect.poll(async () => (await logged(other, yesterday)).map((entry) => [entry.name, entry.eatenAt])).toEqual([
    ['Oats', 7 * 60 + 30],
    ['Rice', 19 * 60],
  ]);
  expect((await water(other, yesterday)).map((drink) => [drink.ml, drink.at.getHours()])).toEqual([
    [glass, 8],
    [glass, 15],
  ]);
  expect(await first(other.dayKinds.watchDayKind(yesterday))).toBe('refeed');
  expect(await first(other.dayMarks.watchCompleteness(yesterday))).toBe('complete');
  expect(await logged(other, today), 'other days untouched').toHaveLength(0);
  expect(screen.getByText('Synced yesterday from your other phone')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await logged(other, yesterday)).map((entry) => [entry.name, entry.eatenAt])).toEqual([['Toast', 8 * 60]]);
  expect((await water(other, yesterday)).map((drink) => drink.ml)).toEqual([glass * 2]);
  expect(await first(other.dayKinds.watchDayKind(yesterday))).toBe('dayOff');
  expect(await first(other.dayMarks.watchCompleteness(yesterday))).toBe('unmarked');
});

it('MM-719: an empty day here is said to lose nothing, and Cancel changes nothing', async () => {
  const other = await otherPhone(sentDay());
  const asks = within(await screen.findByRole('dialog', { name: 'Sync this day from your other phone?' }, slowly));
  expect(asks.getByText(/This phone has nothing for yesterday yet, so nothing is replaced\./)).toBeInTheDocument();
  await userEvent.click(asks.getByRole('button', { name: 'Cancel' }));
  expect(await logged(other, yesterday)).toHaveLength(0);
  expect(await water(other, yesterday)).toHaveLength(0);
  expect(await first(other.dayKinds.watchDayKind(yesterday))).toBe('none');
});
