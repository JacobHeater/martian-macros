import { expect, it } from 'vitest';
import { FakeHealthSource, HealthReadFailure, recordedHealthHistory } from '../../src/healthIngest';
import { healthDailyStepsContract } from '../contracts/healthDailyStepsContract';

/** MM-442: a day's steps as the platform totals them, through the fake. */
const walk = (overrides: { sources?: string } = {}) =>
  FakeHealthSource.fromJson(`{
  "sources": ${overrides.sources ?? '[{"id": "phone", "name": "Phone"}, {"id": "watch", "name": "Watch"}]'},
  "events": [
    {"op": "add", "type": "steps", "id": "p-1", "value": 5000, "start": "2026-09-02T08:00:00", "end": "2026-09-02T09:00:00", "source": "phone"},
    {"op": "add", "type": "steps", "id": "w-1", "value": 5000, "start": "2026-09-02T08:00:00", "end": "2026-09-02T09:00:00", "source": "watch"},
    {"op": "add", "type": "steps", "id": "w-2", "value": 1200, "start": "2026-09-02T18:00:00", "end": "2026-09-02T18:30:00", "source": "watch"},
    {"op": "add", "type": "steps", "id": "p-2", "value": 3000, "start": "2026-09-03T10:00:00", "end": "2026-09-03T11:00:00", "source": "phone"},
    {"op": "add", "type": "steps", "id": "w-3", "value": 4000, "start": "2026-09-03T10:30:00", "end": "2026-09-03T11:30:00", "source": "watch"}
  ]
}`);

async function permitted(source: FakeHealthSource): Promise<FakeHealthSource> {
  await source.permit();
  return source;
}

const range = { from: new Date(2026, 8, 1), to: new Date(2026, 8, 10) };
const totals = async (source: FakeHealthSource) =>
  (await source.dailySteps(range)).map(({ day, steps }) => [day.getDate(), steps]);

healthDailyStepsContract('the fake with overlapping steps', async () => permitted(walk()));
healthDailyStepsContract('the fake with the watch first', async () => {
  const source = await permitted(walk());
  source.stepsPriority = ['watch', 'phone'];
  return source;
});
healthDailyStepsContract('the fake with the recorded history', async () => permitted(FakeHealthSource.fromJson(recordedHealthHistory)));
healthDailyStepsContract('the fake with nothing permitted', async () => walk());

it('the phone and a watch both counted the same walk: the day has one walk, not two', async () => {
  const source = await permitted(walk());
  source.stepsPriority = ['phone', 'watch'];
  const [first] = await source.dailySteps(range);
  expect(first?.day).toEqual(new Date(2026, 8, 2));
  // 5,000 for the walk, counted once, and the watch's 1,200 that evening, which nothing else counted.
  expect(first?.steps).toBe(6200);
});

it('the daily total follows the source priority it was given', async () => {
  const source = await permitted(walk());
  source.stepsPriority = ['phone', 'watch'];
  // 3 September: the phone's 3,000 from 10:00 to 11:00, then the watch's last half hour, 2,000.
  expect(await totals(source)).toEqual([
    [2, 6200],
    [3, 5000],
  ]);
  source.stepsPriority = ['watch', 'phone'];
  // The watch's 4,000 from 10:30 to 11:30, and before it the phone's first half hour, 1,500.
  expect(await totals(source)).toEqual([
    [2, 6200],
    [3, 5500],
  ]);
});

it('with no priority given the sources go by id, whatever the order of the history', async () => {
  const source = await permitted(walk());
  source.stepsPriority = [];
  const byId = await totals(source);
  source.stepsPriority = ['phone'];
  expect(byId).toEqual(await totals(source));
});

it('a walk across midnight is shared between the two days by its time in each', async () => {
  const source = await permitted(
    FakeHealthSource.fromJson(`{"sources": [{"id": "phone", "name": "Phone"}], "events": [
      {"op": "add", "type": "steps", "id": "late", "value": 1000, "start": "2026-09-02T23:30:00", "end": "2026-09-03T00:30:00", "source": "phone"}
    ]}`),
  );
  expect(await totals(source)).toEqual([
    [2, 500],
    [3, 500],
  ]);
});

it('steps that cannot be read just now are a failure, never no steps', async () => {
  const source = await permitted(walk());
  source.unreadable = true;
  await expect(source.dailySteps(range)).rejects.toBeInstanceOf(HealthReadFailure);
});

it('steps not permitted give nothing', async () => {
  expect(await walk().dailySteps(range)).toEqual([]);
});
