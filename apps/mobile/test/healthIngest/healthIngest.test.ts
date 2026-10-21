import { describe, expect, it } from 'vitest';
import {
  FakeHealthSource,
  type HealthDataType,
  HealthImporter,
  HealthReadFailure,
  InMemoryHealthSampleStore,
  recordedHealthHistory,
} from '../../src/healthIngest';
import { healthBackfillMarksContract } from '../contracts/healthBackfillMarksContract';
import { healthHistoryAccessContract } from '../contracts/healthHistoryAccessContract';
import { healthSampleStoreContract } from '../contracts/healthSampleStoreContract';
import { healthSourceContract } from '../contracts/healthSourceContract';

/** MM-67: the health seam, its fake, and importing through it. */
const everything = { from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) };

async function permitted(happened?: number): Promise<FakeHealthSource> {
  const source = FakeHealthSource.fromJson(recordedHealthHistory, { happened });
  await source.permit();
  return source;
}

healthSourceContract('the fake with the whole history', () => permitted());
healthSourceContract('the fake part way through its history', () => permitted(5));
healthSourceContract('the fake with only weight permitted', async () => {
  const source = FakeHealthSource.fromJson(recordedHealthHistory);
  await source.permit(new Set<HealthDataType>(['weight']));
  return source;
});
healthSourceContract('the fake with nothing permitted', async () => FakeHealthSource.fromJson(recordedHealthHistory));

healthSampleStoreContract('In-memory', () => new InMemoryHealthSampleStore());
// MM-73: the history permission and how far back the history has been read.
healthBackfillMarksContract('In-memory', () => new InMemoryHealthSampleStore());
healthHistoryAccessContract('the fake with no window, as Apple Health', () => permitted());
healthHistoryAccessContract('the fake with a window, granting history', async () => {
  const source = await permitted();
  source.historyFrom = new Date(2026, 8, 5);
  return source;
});
healthHistoryAccessContract('the fake with a window, refusing history', async () => {
  const source = await permitted();
  source.historyFrom = new Date(2026, 8, 5);
  source.willPermitHistory = false;
  return source;
});
healthHistoryAccessContract('the fake with history already granted', async () => {
  const source = await permitted();
  source.historyFrom = new Date(2026, 8, 5);
  source.permitHistory();
  return source;
});

describe('the fake', () => {
  it('serves the recorded history: sources, an edit and a deletion', async () => {
    const source = await permitted();
    const weights = await source.read('weight', everything);
    expect(weights.map((s) => s.platformId)).toEqual(['w-1', 'w-3', 'w-4', 'w-5', 'w-6']);
    const edited = weights[1];
    expect(edited?.value).toBe(82.4);
    expect(edited?.sourceId).toBe('com.example.manual');
    expect(edited?.sourceName).toBe('Health app, typed');
    expect(weights[0]?.sourceName).toBe('Bathroom scale');
    expect(await source.available()).toEqual(new Set(['weight', 'bodyFat', 'steps', 'workout', 'height']));
  });

  it('a reading with a span keeps its end', async () => {
    const source = await permitted();
    const workouts = await source.read('workout', everything);
    expect(workouts).toHaveLength(1);
    expect(workouts[0]?.value).toBe(55);
    expect(workouts[0]?.end).toEqual(new Date(2026, 8, 2, 18, 55));
  });

  it('before the edit and the deletion it shows what was there then', async () => {
    const source = await permitted(9);
    const weights = await source.read('weight', everything);
    expect(weights.map((s) => s.platformId)).toEqual(['w-1', 'w-2', 'w-3', 'w-4', 'w-5']);
    expect(weights[2]?.value).toBe(83.0);
  });

  it('changes since a token: the edit, the deletion and the new one', async () => {
    const source = await permitted(9);
    const first = await source.changesSince('weight', undefined);
    expect(first.upserted).toHaveLength(5);
    source.letAllHappen();
    const changes = await source.changesSince('weight', first.nextToken);
    expect(changes.upserted.map((s) => s.platformId)).toEqual(['w-3', 'w-6']);
    expect(changes.upserted[0]?.value).toBe(82.4);
    expect(changes.deletedIds).toEqual(['w-2']);
  });

  it('a reading added and deleted between two imports is only a deletion', async () => {
    const source = await permitted(1);
    const first = await source.changesSince('weight', undefined);
    source.letAllHappen();
    const changes = await source.changesSince('weight', first.nextToken);
    expect(changes.upserted.map((s) => s.platformId)).not.toContain('w-2');
    expect(changes.deletedIds).toEqual(['w-2']);
  });

  it('an expired token says so', async () => {
    const source = await permitted();
    const first = await source.changesSince('weight', undefined);
    source.expireTokens();
    const changes = await source.changesSince('weight', first.nextToken);
    expect(changes.tokenExpired).toBe(true);
    expect(changes.nextToken).toBe('');
  });

  it('permission is asked for, and the user may refuse some', async () => {
    const source = FakeHealthSource.fromJson(recordedHealthHistory);
    source.willPermit = new Set<HealthDataType>(['weight']);
    expect((await source.permitted()).size).toBe(0);
    const after = await source.requestPermission(new Set<HealthDataType>(['weight', 'steps', 'menstruation']));
    expect(after).toEqual(new Set(['weight']));
  });
});

describe('importing', () => {
  let source: FakeHealthSource;
  let store: InMemoryHealthSampleStore;
  let importer: HealthImporter;

  async function setUpWith(happened?: number): Promise<void> {
    source = await permitted(happened);
    store = new InMemoryHealthSampleStore();
    importer = new HealthImporter({ source, store });
  }

  const storedWeights = async () => (await store.samples('weight')).map((s) => s.platformId);

  it('the first import brings everything, with where it came from', async () => {
    await setUpWith();
    const result = await importer.import('weight');
    expect(result.status).toBe('updated');
    expect(result.upserted).toBe(5);
    const stored = await store.samples('weight');
    expect(stored).toHaveLength(5);
    expect(new Set(stored.map((s) => s.sourceId))).toEqual(new Set(['com.example.scale', 'com.example.manual']));
  });

  it('importing twice does not duplicate', async () => {
    await setUpWith();
    await importer.import('weight');
    const again = await importer.import('weight');
    expect(again.upserted).toBe(0);
    expect(again.deleted).toBe(0);
    expect(await storedWeights()).toHaveLength(5);
  });

  it('importing again with a token the platform does not know does not duplicate either', async () => {
    await setUpWith();
    await importer.import('weight');
    await store.saveToken('weight', 'forgotten');
    const again = await importer.import('weight');
    expect(again.status).toBe('readAgain');
    expect(await storedWeights()).toHaveLength(5);
  });

  it('a reading deleted on the platform is removed', async () => {
    await setUpWith(9);
    await importer.import('weight');
    expect(await storedWeights()).toContain('w-2');
    source.letAllHappen();
    const result = await importer.import('weight');
    expect(result.deleted).toBe(1);
    expect(await storedWeights()).toEqual(['w-1', 'w-3', 'w-4', 'w-5', 'w-6']);
  });

  it('a reading edited on the platform is brought up to date', async () => {
    await setUpWith(9);
    await importer.import('weight');
    source.letAllHappen();
    await importer.import('weight');
    const edited = (await store.samples('weight')).find((s) => s.platformId === 'w-3');
    expect(edited?.value).toBe(82.4);
  });

  it('an expired token: everything is read again, and what the platform no longer has is gone', async () => {
    await setUpWith(9);
    await importer.import('weight');
    source.letAllHappen();
    source.expireTokens();
    const result = await importer.import('weight');
    expect(result.status).toBe('readAgain');
    expect(await storedWeights()).toEqual(['w-1', 'w-3', 'w-4', 'w-5', 'w-6']);
    const after = await importer.import('weight');
    expect(after.status).toBe('updated');
    expect(after.upserted).toBe(0);
  });

  it('each type is imported and kept apart', async () => {
    await setUpWith();
    await importer.import('weight');
    await importer.import('bodyFat');
    expect(await store.samples('bodyFat')).toHaveLength(1);
    expect(await store.samples('steps')).toEqual([]);
    await store.replace('bodyFat', []);
    expect(await storedWeights()).toHaveLength(5);
  });

  it('when the platform cannot be read, what is stored is left as it was', async () => {
    await setUpWith(9);
    await importer.import('weight');
    const before = await store.samples('weight');
    const token = await store.token('weight');
    source.letAllHappen();
    source.unreadable = true;
    await expect(importer.import('weight')).rejects.toBeInstanceOf(HealthReadFailure);
    expect(await store.samples('weight')).toEqual(before);
    expect(await store.token('weight')).toBe(token);

    // The same with a token the platform has forgotten: the read that
    // would replace everything fails first.
    source.expireTokens();
    await expect(importer.import('weight')).rejects.toBeInstanceOf(HealthReadFailure);
    expect(await store.samples('weight')).toEqual(before);

    source.unreadable = false;
    const result = await importer.import('weight');
    expect(result.status).toBe('readAgain');
    expect(await storedWeights()).toEqual(['w-1', 'w-3', 'w-4', 'w-5', 'w-6']);
  });

  it('a type the user has not permitted is left alone', async () => {
    source = FakeHealthSource.fromJson(recordedHealthHistory);
    await source.permit(new Set<HealthDataType>(['steps']));
    store = new InMemoryHealthSampleStore();
    importer = new HealthImporter({ source, store });
    const result = await importer.import('weight');
    expect(result.status).toBe('notPermitted');
    expect(await storedWeights()).toEqual([]);
    expect(await store.token('weight')).toBeUndefined();
  });
});
