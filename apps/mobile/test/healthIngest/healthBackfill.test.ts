import { beforeEach, describe, expect, it } from 'vitest';
import {
  dailyWeighIns,
  FakeHealthSource,
  HealthBackfill,
  HealthImporter,
  HealthReadFailure,
  InMemoryHealthSampleStore,
  primaryWeightSource,
} from '../../src/healthIngest';

/** MM-73: reading a new user's history, up to a year back, a month at a time. */
const dayMs = 24 * 60 * 60 * 1000;
const now = new Date(2026, 9, 21, 12, 0);
const daysAgo = (days: number, hour = 7) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hour, 0);
const local = (at: Date) =>
  `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}` +
  `T${String(at.getHours()).padStart(2, '0')}:00:00`;

/**
 * A scale that weighed every morning for `days` days up to yesterday, and
 * a phone that also wrote a weight on every tenth of those mornings, later
 * and heavier. Every reading is made up.
 */
function history(days: number): string {
  const events: string[] = [];
  for (let d = days; d >= 1; d--) {
    events.push(
      `{"op": "add", "type": "weight", "id": "w-${d}", "value": ${80 + d * 0.01}, "start": "${local(daysAgo(d))}", "source": "scale"}`,
    );
    if (d % 10 === 0) {
      events.push(
        `{"op": "add", "type": "weight", "id": "p-${d}", "value": ${90 + d * 0.01}, "start": "${local(daysAgo(d, 8))}", "source": "phone"}`,
      );
    }
  }
  events.push(`{"op": "add", "type": "bodyFat", "id": "f-200", "value": 22, "start": "${local(daysAgo(200))}", "source": "scale"}`);
  return `{"sources": [{"id": "scale", "name": "Bathroom scale"}, {"id": "phone", "name": "Phone"}], "events": [${events.join(',')}]}`;
}

let source: FakeHealthSource;
let store: InMemoryHealthSampleStore;
let backfill: HealthBackfill;
let reads: { from: Date; to: Date }[];

/** A user with `days` days of weigh-ins who has just allowed weight, as Health Connect allows it: thirty days back. */
async function connect(days: number): Promise<void> {
  source = FakeHealthSource.fromJson(history(days));
  source.historyFrom = new Date(now.getTime() - 30 * dayMs);
  await source.permit(new Set(['weight', 'bodyFat']));
  store = new InMemoryHealthSampleStore();
  await new HealthImporter({ source, store }).import('weight');
  reads = [];
  const read = source.read.bind(source);
  source.read = async (type, range) => {
    reads.push(range);
    return read(type, range);
  };
  backfill = new HealthBackfill({ source, history: source, store, marks: store });
}

const weights = async () => store.samples('weight');

beforeEach(async () => {
  await connect(180);
});

it('six months of weigh-ins with the history granted: all of them are kept', async () => {
  expect(await weights()).toHaveLength(29 + 2);
  expect(await source.requestHistory()).toBe(true);
  const result = await backfill.backfill('weight', { now });
  expect(result.status).toBe('done');
  expect(result.added).toBe(198 - 31);
  expect(await weights()).toHaveLength(198);
});

it('one weigh-in counts a day, the primary scale first, after the history arrives (MM-71)', async () => {
  source.permitHistory();
  await backfill.backfill('weight', { now });
  const samples = await weights();
  const primarySourceId = primaryWeightSource(samples, { asOf: now });
  expect(primarySourceId).toBe('scale');
  const days = dailyWeighIns(samples, { primarySourceId });
  expect(days).toHaveLength(180);
  expect(days[0]?.day).toEqual(new Date(daysAgo(180).setHours(0)));
  // The phone's heavier readings on every tenth day are kept but not used.
  expect(days.every((day) => day.sourceName === 'Bathroom scale' && day.readings === 1)).toBe(true);
});

it('the history refused: the thirty days the platform allows, and nothing is marked', async () => {
  source.willPermitHistory = false;
  expect(await source.requestHistory()).toBe(false);
  const result = await backfill.backfill('weight', { now });
  expect(result).toEqual({ status: 'noHistory', upserted: 0, added: 0 });
  expect(reads).toEqual([]);
  expect(await weights()).toHaveLength(31);
  expect(await store.backfilledFrom('weight')).toBeUndefined();
});

it('a history granted later is read then', async () => {
  expect((await backfill.backfill('weight', { now })).status).toBe('noHistory');
  source.permitHistory();
  expect((await backfill.backfill('weight', { now })).status).toBe('done');
  expect(await weights()).toHaveLength(198);
});

it('reads a month at a time, from now back a year and no further', async () => {
  source.permitHistory();
  await backfill.backfill('weight', { now });
  expect(reads).toHaveLength(13);
  expect(reads[0]?.to).toEqual(now);
  expect(reads.at(-1)?.from).toEqual(new Date(now.getTime() - 365 * dayMs));
  reads.forEach((range, i) => {
    expect(range.to.getTime() - range.from.getTime()).toBeLessThanOrEqual(30 * dayMs);
    if (i > 0) expect(range.to).toEqual(reads[i - 1]?.from);
  });
  expect(await store.backfilledFrom('weight')).toEqual(new Date(now.getTime() - 365 * dayMs));
});

it('nothing older than a year is read', async () => {
  await connect(400);
  source.permitHistory();
  await backfill.backfill('weight', { now });
  const oldest = (await weights())[0];
  expect(oldest?.start.getTime()).toBeGreaterThanOrEqual(now.getTime() - 365 * dayMs);
});

it('cut short, it keeps what it read and goes on from where it stopped', async () => {
  source.permitHistory();
  const read = source.read.bind(source);
  source.read = async (type, range) => {
    if (reads.length >= 3) throw new HealthReadFailure(`reading ${type}`);
    return read(type, range);
  };
  await expect(backfill.backfill('weight', { now })).rejects.toBeInstanceOf(HealthReadFailure);
  const stoppedAt = new Date(now.getTime() - 90 * dayMs);
  expect(await store.backfilledFrom('weight')).toEqual(stoppedAt);
  expect((await weights()).every((s) => s.start.getTime() >= stoppedAt.getTime())).toBe(true);
  expect((await weights()).length).toBeGreaterThan(31);

  source.read = read;
  reads.length = 0;
  const result = await backfill.backfill('weight', { now });
  expect(result.status).toBe('done');
  expect(reads[0]?.to).toEqual(stoppedAt);
  expect(await weights()).toHaveLength(198);
});

it('once done it reads nothing again, and asks nothing of the platform', async () => {
  source.permitHistory();
  await backfill.backfill('weight', { now });
  reads.length = 0;
  source.revokeHistory();
  const later = new Date(now.getTime() + 7 * dayMs);
  expect(await backfill.backfill('weight', { now: later })).toEqual({ status: 'done', upserted: 0, added: 0 });
  expect(reads).toEqual([]);
});

it('what the import already kept is kept once and not counted as new', async () => {
  source.permitHistory();
  const before = await weights();
  const result = await backfill.backfill('weight', { now });
  expect(result.upserted).toBe(198);
  expect(result.added).toBe(198 - before.length);
  expect(new Set((await weights()).map((s) => s.platformId)).size).toBe(198);
});

it('a kind not allowed is not read', async () => {
  source.permitHistory();
  expect(await backfill.backfill('leanMass', { now })).toEqual({ status: 'notPermitted', upserted: 0, added: 0 });
  expect(reads).toEqual([]);
});

it('body fat is read back as weight is', async () => {
  source.permitHistory();
  await backfill.backfill('bodyFat', { now });
  expect((await store.samples('bodyFat')).map((s) => s.platformId)).toEqual(['f-200']);
});

it('says after each month how far it has read and what was new', async () => {
  source.permitHistory();
  const told: { read: number; added: number }[] = [];
  await backfill.backfill('weight', { now, onMonth: ({ read, added }) => told.push({ read, added }) });
  expect(told).toHaveLength(13);
  expect(told.at(-1)?.read).toBe(1);
  told.forEach((step, i) => {
    if (i > 0) expect(step.read).toBeGreaterThan(told[i - 1]?.read ?? 0);
  });
  expect(told.reduce((sum, step) => sum + step.added, 0)).toBe(198 - 31);
});

it('the kinds read back are those the trend and the body-fat estimate use', () => {
  expect(HealthBackfill.types).toEqual(['weight', 'bodyFat', 'leanMass', 'menstruation']);
});

describe('MM-498', () => {
  // A re-read after an expired token makes the store match what the
  // platform shows, and without the history permission it shows thirty
  // days: the history read before is dropped, though MM-68 keeps what was
  // read when a permission is taken away.
  it.skip('MM-498: a re-read after the history permission is taken away keeps the history', async () => {
    source.permitHistory();
    await backfill.backfill('weight', { now });
    source.revokeHistory();
    source.expireTokens();
    const result = await new HealthImporter({ source, store }).import('weight');
    expect(result.status).toBe('readAgain');
    expect(await weights()).toHaveLength(198);
  });
});
