import { expect, it } from 'vitest';
import type { HealthDataType } from '../../src/healthIngest/HealthDataType';
import { NativeHealthSource } from '../../src/platform/NativeHealthSource';
import type { MmHealthRecord } from '../../src/platform/MmHealthRecord';
import { NoHealthPlatform } from '../../src/platform/NoHealthPlatform';
import { healthHistoryAccessContract } from '../contracts/healthHistoryAccessContract';
import { healthPermissionsPlaceContract } from '../contracts/healthPermissionsPlaceContract';
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

// MM-323: where to allow what Health Connect no longer asks about, through the plugin and where there is none.
healthPermissionsPlaceContract(
  'Health Connect, asking',
  async () => new NativeHealthSource(fakeMmHealth([...held], { permitted: [] }).api, { opensPermissions: true }),
);
healthPermissionsPlaceContract(
  'Health Connect, no longer asking about weight',
  async () =>
    new NativeHealthSource(fakeMmHealth([...held], { permitted: [], stopsAsking: ['weight'] }).api, { opensPermissions: true }),
);
healthPermissionsPlaceContract('an iPhone, with no screen to open', async () => new NativeHealthSource(fakeMmHealth([...held]).api));
healthPermissionsPlaceContract('no health platform', async () => new NoHealthPlatform());

it('a refusal that came back without the question shown is one Health Connect stopped asking about (MM-323)', async () => {
  const fake = fakeMmHealth([...held], { permitted: [], stopsAsking: ['weight'] });
  const source = new NativeHealthSource(fake.api, { opensPermissions: true });
  expect(await source.requestPermission(new Set<HealthDataType>(['weight']))).toEqual(new Set());
  expect(await source.stoppedAsking('weight')).toBe(true);
  // Asked for again with a kind it still asks about, the question is shown: weight is no longer counted as unshown.
  await source.requestPermission(new Set<HealthDataType>(['weight', 'steps']));
  expect(await source.stoppedAsking('weight')).toBe(false);
  expect(await source.stoppedAsking('steps')).toBe(false);
});

it('Health Connect’s screen of the app’s permissions is opened only where the shell has one (MM-323)', async () => {
  const android = fakeMmHealth([...held]);
  expect(await new NativeHealthSource(android.api, { opensPermissions: true }).openPermissions()).toBe(true);
  expect(android.permissionsOpened()).toBe(1);
  const iphone = fakeMmHealth([...held]);
  expect(await new NativeHealthSource(iphone.api).openPermissions()).toBe(false);
  expect(iphone.permissionsOpened()).toBe(0);
  const failing = fakeMmHealth([...held]);
  const rejects = new NativeHealthSource(
    { ...failing.api, openPermissions: () => Promise.reject(new Error('no activity')) },
    { opensPermissions: true },
  );
  expect(await rejects.openPermissions()).toBe(false);
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
