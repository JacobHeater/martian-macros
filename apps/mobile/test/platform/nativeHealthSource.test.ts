import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { NativeHealthSource } from '../../src/platform/NativeHealthSource';
import type { MmHealthRecord } from '../../src/platform/MmHealthRecord';
import { NoHealthPlatform } from '../../src/platform/NoHealthPlatform';
import { healthHistoryAccessContract } from '../contracts/healthHistoryAccessContract';
import { healthSourceContract } from '../contracts/healthSourceContract';
import { fakeMmHealth } from '../support/fakeMmHealth';

const clock = new FixedClock(CalendarDate.of(2026, 10, 21));

const day = (n: number) => new Date(2026, 8, n, 7, 0).getTime();

const held: MmHealthRecord[] = [
  { id: 'w1', type: 'weight', value: 82.4, startMs: day(1), endMs: day(1), sourceId: 'scale', sourceName: 'Scale' },
  { id: 'w2', type: 'weight', value: 82.1, startMs: day(2), endMs: day(2), sourceId: 'scale', sourceName: 'Scale' },
  { id: 's1', type: 'steps', value: 8042, startMs: day(1), endMs: day(1) + 3600000, sourceId: 'watch', sourceName: 'Watch' },
];

// MM-68: the adapter the phone uses, with the plugin stood in for.
healthSourceContract('Health Connect (bridge stood in for)', async () => new NativeHealthSource(fakeMmHealth([...held]).api, clock));

// MM-73: the history permission, through the plugin and where there is none.
healthHistoryAccessContract('Health Connect, history granted when asked', async () => new NativeHealthSource(fakeMmHealth([...held]).api, clock));
healthHistoryAccessContract(
  'Health Connect, history refused',
  async () => new NativeHealthSource(fakeMmHealth([...held], { grantsHistory: false }).api, clock),
);
healthHistoryAccessContract(
  'Health Connect, history granted already',
  async () => new NativeHealthSource(fakeMmHealth([...held], { history: true }).api, clock),
);
healthHistoryAccessContract('no health platform', async () => new NoHealthPlatform());

it('the history is asked for through the plugin, which shows the question once (MM-73)', async () => {
  const fake = fakeMmHealth([...held], { grantsHistory: false });
  const source = new NativeHealthSource(fake.api, clock);
  expect(await source.historyPermitted()).toBe(false);
  expect(await source.requestHistory()).toBe(false);
  expect(await source.requestHistory()).toBe(false);
  expect(fake.historyAsked()).toBe(1);
});

it('a phone without Health Connect has no history to ask for (MM-73)', async () => {
  const fake = fakeMmHealth([...held], { history: true });
  const source = new NativeHealthSource({ ...fake.api, status: async () => ({ status: 'unavailable' }) }, clock);
  expect(await source.historyPermitted()).toBe(false);
  expect(await source.requestHistory()).toBe(false);
  expect(fake.historyAsked()).toBe(0);
});

it('a change after the token is told, and a deletion is told as one', async () => {
  const fake = fakeMmHealth([...held]);
  const source = new NativeHealthSource(fake.api, clock);
  const first = await source.changesSince('weight', undefined);
  expect(first.upserted.map((s) => s.platformId)).toEqual(['w1', 'w2']);
  fake.change({ record: { id: 'w3', type: 'weight', value: 81.8, startMs: day(3), endMs: day(3), sourceId: 'scale', sourceName: 'Scale' } });
  fake.change({ deletedId: 'w1' });
  const next = await source.changesSince('weight', first.nextToken);
  expect(next.upserted.map((s) => s.platformId)).toEqual(['w3']);
  expect(next.deletedIds).toEqual(['w1']);
  expect(next.tokenExpired).toBe(false);
});

it('a type never granted reads as nothing and keeps the token it was asked with', async () => {
  const fake = fakeMmHealth([...held], { permitted: ['weight'] });
  const source = new NativeHealthSource(fake.api, clock);
  expect(await source.read('steps', { from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) })).toEqual([]);
  expect((await source.changesSince('steps', 'kept')).nextToken).toBe('kept');
});

it('without the history, what is shown starts thirty days before the app clock\'s now, and with it nothing limits it (MM-498)', async () => {
  const fake = fakeMmHealth([...held], { grantsHistory: false });
  const source = new NativeHealthSource(fake.api, clock);
  expect(await source.readableFrom()).toEqual(new Date(new Date(2026, 9, 21, 12).getTime() - 30 * 24 * 60 * 60 * 1000));
  const granted = new NativeHealthSource(fakeMmHealth([...held], { history: true }).api, clock);
  expect(await granted.readableFrom()).toBeUndefined();
});
