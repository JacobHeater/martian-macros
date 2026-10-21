import { expect, it } from 'vitest';
import { NativeHealthSource } from '../../src/platform/NativeHealthSource';
import type { MmHealthRecord } from '../../src/platform/MmHealthRecord';
import { NoHealthPlatform } from '../../src/platform/NoHealthPlatform';
import { HealthReadFailure } from '../../src/healthIngest/HealthReadFailure';
import { healthDailyStepsContract } from '../contracts/healthDailyStepsContract';
import { healthHistoryAccessContract } from '../contracts/healthHistoryAccessContract';
import { healthSourceContract } from '../contracts/healthSourceContract';
import { fakeMmHealth } from '../support/fakeMmHealth';

const day = (n: number) => new Date(2026, 8, n, 7, 0).getTime();

const held: MmHealthRecord[] = [
  { id: 'w1', type: 'weight', value: 82.4, startMs: day(1), endMs: day(1), sourceId: 'scale', sourceName: 'Scale' },
  { id: 'w2', type: 'weight', value: 82.1, startMs: day(2), endMs: day(2), sourceId: 'scale', sourceName: 'Scale' },
  { id: 's1', type: 'steps', value: 8042, startMs: day(1), endMs: day(1) + 3600000, sourceId: 'watch', sourceName: 'Watch' },
];

// MM-68: the adapter the phone uses, with the plugin stood in for.
healthSourceContract('Health Connect (bridge stood in for)', async () => new NativeHealthSource(fakeMmHealth([...held]).api));

// MM-73: the history permission, through the plugin and where there is none.
healthHistoryAccessContract('Health Connect, history granted when asked', async () => new NativeHealthSource(fakeMmHealth([...held]).api));
healthHistoryAccessContract(
  'Health Connect, history refused',
  async () => new NativeHealthSource(fakeMmHealth([...held], { grantsHistory: false }).api),
);
healthHistoryAccessContract(
  'Health Connect, history granted already',
  async () => new NativeHealthSource(fakeMmHealth([...held], { history: true }).api),
);
healthHistoryAccessContract('no health platform', async () => new NoHealthPlatform());

// MM-442: a day's steps as the platform totals them, through the plugin and where there is none.
healthDailyStepsContract('Health Connect (bridge stood in for)', async () => new NativeHealthSource(fakeMmHealth([...held]).api));
healthDailyStepsContract(
  'Health Connect, steps not permitted',
  async () => new NativeHealthSource(fakeMmHealth([...held], { permitted: ['weight'] }).api),
);
healthDailyStepsContract('no health platform', async () => new NoHealthPlatform());

it("two devices counted the same walk: the day has the platform's total, not the sum of its readings (MM-442)", async () => {
  const walk = (id: string, sourceId: string): MmHealthRecord => ({
    id,
    type: 'steps',
    value: 5000,
    startMs: new Date(2026, 8, 2, 8, 0).getTime(),
    endMs: new Date(2026, 8, 2, 9, 0).getTime(),
    sourceId,
    sourceName: sourceId,
  });
  const fake = fakeMmHealth([walk('p', 'phone'), walk('w', 'watch')], {
    stepDays: [{ startMs: new Date(2026, 8, 2).getTime(), steps: 5000 }],
  });
  const source = new NativeHealthSource(fake.api);
  const days = await source.dailySteps({ from: new Date(2026, 8, 1, 15, 0), to: new Date(2026, 8, 3, 9, 0) });
  expect(days).toEqual([{ day: new Date(2026, 8, 2), steps: 5000 }]);
  // Asked from the local midnight of the first day up to that of the last.
  expect(fake.dailyStepsAsked()).toEqual([{ fromMs: new Date(2026, 8, 1).getTime(), toMs: new Date(2026, 8, 3).getTime() }]);
});

it("the platform's days are kept to the range, each once, whole, and none without steps (MM-442)", async () => {
  const fake = fakeMmHealth([], {
    stepDays: [
      { startMs: new Date(2026, 8, 4).getTime(), steps: 0 },
      { startMs: new Date(2026, 8, 3).getTime(), steps: 4321.6 },
      { startMs: new Date(2026, 8, 9).getTime(), steps: 900 },
    ],
  });
  const days = await new NativeHealthSource(fake.api).dailySteps({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 8) });
  expect(days).toEqual([{ day: new Date(2026, 8, 3), steps: 4322 }]);
});

it('steps not permitted are not asked for; a refused read is a failure (MM-442)', async () => {
  const range = { from: new Date(2026, 8, 1), to: new Date(2026, 8, 8) };
  const unpermitted = fakeMmHealth([...held], { permitted: ['weight'] });
  expect(await new NativeHealthSource(unpermitted.api).dailySteps(range)).toEqual([]);
  expect(unpermitted.dailyStepsAsked()).toEqual([]);
  const fake = fakeMmHealth([...held]);
  const refusing = new NativeHealthSource({ ...fake.api, dailySteps: () => Promise.reject(new Error('refused')) });
  await expect(refusing.dailySteps(range)).rejects.toBeInstanceOf(HealthReadFailure);
});

it('the history is asked for through the plugin, which shows the question once (MM-73)', async () => {
  const fake = fakeMmHealth([...held], { grantsHistory: false });
  const source = new NativeHealthSource(fake.api);
  expect(await source.historyPermitted()).toBe(false);
  expect(await source.requestHistory()).toBe(false);
  expect(await source.requestHistory()).toBe(false);
  expect(fake.historyAsked()).toBe(1);
});

it('a phone without Health Connect has no history to ask for (MM-73)', async () => {
  const fake = fakeMmHealth([...held], { history: true });
  const source = new NativeHealthSource({ ...fake.api, status: async () => ({ status: 'unavailable' }) });
  expect(await source.historyPermitted()).toBe(false);
  expect(await source.requestHistory()).toBe(false);
  expect(fake.historyAsked()).toBe(0);
});

it('a change after the token is told, and a deletion is told as one', async () => {
  const fake = fakeMmHealth([...held]);
  const source = new NativeHealthSource(fake.api);
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
  const source = new NativeHealthSource(fake.api);
  expect(await source.read('steps', { from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) })).toEqual([]);
  expect((await source.changesSince('steps', 'kept')).nextToken).toBe('kept');
});
