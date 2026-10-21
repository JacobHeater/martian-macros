import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { FakeHealthSource, HealthSyncSchedule, recordedHealthHistory } from '../../src/healthIngest';
import { AppState } from '../../src/state/AppState';
import { servicesOf } from '../support/servicesOf';

/**
 * MM-72: the health platform is kept current from the app's own lifecycle.
 * Opening always reads; coming back to the front reads once the last read
 * is old enough; one read runs at a time.
 */
const today = CalendarDate.of(2026, 10, 21);
const minuteMs = 60 * 1000;

let repos: InMemoryRepositories;
let clock: FixedClock;
let source: FakeHealthSource;
let state: AppState;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  clock = new FixedClock(today, { hour: 8 });
  // Nine events have happened: five weigh-ins so far. The rest (an edit, a deletion, a new reading) happen later.
  source = FakeHealthSource.fromJson(recordedHealthHistory, { happened: 9 });
  await source.permit(new Set(['weight']));
  state = new AppState({ ...servicesOf(repos, clock), healthSource: source });
});

const storedIds = async () => (await repos.healthSamples.samples('weight')).map((s) => s.platformId);
const afterEverything = ['w-1', 'w-3', 'w-4', 'w-5', 'w-6'];

describe('opening the app', () => {
  it('reads what is new, whatever happened before', async () => {
    expect(await state.syncHealth('opened')).toBe(true);
    expect(await storedIds()).toEqual(['w-1', 'w-2', 'w-3', 'w-4', 'w-5']);
    source.letAllHappen();
    // Opening again (as after the system stopped the app) reads, even a minute later.
    clock.elapseMs(minuteMs);
    expect(await state.syncHealth('opened')).toBe(true);
    expect(await storedIds()).toEqual(afterEverything);
  });
});

describe('coming back to the front', () => {
  it('soon after a read does not ask the platform again', async () => {
    await state.syncHealth('opened');
    source.letAllHappen();
    const asked = vi.spyOn(source, 'changesSince');
    clock.elapseMs(HealthSyncSchedule.resumeIntervalMs - minuteMs);
    expect(await state.syncHealth('resumed')).toBe(true);
    expect(asked).not.toHaveBeenCalled();
    expect(await storedIds()).toEqual(['w-1', 'w-2', 'w-3', 'w-4', 'w-5']);
  });

  it('once the interval has passed, reads only what changed since', async () => {
    await state.syncHealth('opened');
    const token = await repos.healthSamples.token('weight');
    source.letAllHappen();
    const asked = vi.spyOn(source, 'changesSince');
    clock.elapseMs(HealthSyncSchedule.resumeIntervalMs);
    expect(await state.syncHealth('resumed')).toBe(true);
    expect(asked).toHaveBeenCalledWith('weight', token);
    expect(await storedIds()).toEqual(afterEverything);
  });

  it('after a read that failed, tries again at once', async () => {
    source.unreadable = true;
    expect(await state.syncHealth('opened')).toBe(false);
    source.unreadable = false;
    expect(await state.syncHealth('resumed')).toBe(true);
    expect(await storedIds()).toEqual(['w-1', 'w-2', 'w-3', 'w-4', 'w-5']);
  });

  it('six weeks later, with the token expired, reads the window again without duplicates and keeps a new token', async () => {
    await state.syncHealth('opened');
    const before = await repos.healthSamples.token('weight');
    source.letAllHappen();
    source.expireTokens();
    clock.advanceTo(today.addDays(42));
    expect(await state.syncHealth('resumed')).toBe(true);
    expect(await storedIds()).toEqual(afterEverything);
    const after = await repos.healthSamples.token('weight');
    expect(after).toBeDefined();
    expect(after).not.toBe(before);
  });
});

describe('one read at a time', () => {
  it('opening and coming back together read the platform once', async () => {
    const asked = vi.spyOn(source, 'changesSince');
    const results = await Promise.all([state.syncHealth('opened'), state.syncHealth('opened'), state.syncHealth('resumed')]);
    expect(results).toEqual([true, true, true]);
    expect(asked).toHaveBeenCalledTimes(1);
  });

  it('asking while a read runs reads again after it, so a kind allowed just now is read', async () => {
    const opening = state.syncHealth('opened');
    await source.permit(new Set(['weight', 'steps']));
    const asking = state.syncHealth('asked');
    expect(await opening).toBe(true);
    expect(await asking).toBe(true);
    expect(await repos.healthSamples.token('steps')).toBeDefined();
  });
});
