import { expect, it } from 'vitest';
import type { PlatformWorkout } from '../../src/domain/training/PlatformWorkout';
import { CardioSession } from '../../src/domain/training/CardioSession';
import { cardioSessionImports } from '../../src/engine/cardioSessionImports';
import { workoutClientIdPrefix } from '../../src/engine/workoutClientIdPrefix';

/** MM-677: what a read of the platform's workouts changes among the cardio sessions kept. */
const minuteMs = 60 * 1000;
const at = (hour: number, minute = 0) => new Date(2026, 9, 4, hour, minute);

const read = (over: Partial<PlatformWorkout> & { platformId: string }): PlatformWorkout => ({
  clientId: undefined,
  strength: false,
  cardio: 'walking',
  start: at(7),
  end: at(7, 42),
  segments: [],
  sourceId: 'com.example.watch',
  sourceName: 'Watch',
  ...over,
});

it('every non-strength session with an activity is kept, as a session of that activity with its span and source', () => {
  const changes = cardioSessionImports({
    platform: [read({ platformId: 'walk' }), read({ platformId: 'hiit', cardio: 'intervals', start: at(18), end: at(18, 20) })],
    kept: [],
  });
  expect(changes.map((s) => [s.platformId, s.activity, s.minutes, s.sourceName])).toEqual([
    ['walk', 'walking', 42, 'Watch'],
    ['hiit', 'intervals', 20, 'Watch'],
  ]);
});

it('a strength session, one with no activity (an older plugin), one this app wrote, and one with no span are not cardio', () => {
  const changes = cardioSessionImports({
    platform: [
      read({ platformId: 'lift', strength: true, cardio: undefined }),
      read({ platformId: 'unnamed', cardio: undefined }),
      read({ platformId: 'ours', clientId: `${workoutClientIdPrefix}1` }),
      read({ platformId: 'empty', end: at(7) }),
    ],
    kept: [],
  });
  expect(changes).toEqual([]);
});

it('a session already kept is saved again only when its span, activity or source changed', () => {
  const kept = new CardioSession({ platformId: 'walk', sourceName: 'Watch', activity: 'walking', start: at(7), end: at(7, 42) });
  expect(cardioSessionImports({ platform: [read({ platformId: 'walk' })], kept: [kept] })).toEqual([]);
  const moved = cardioSessionImports({ platform: [read({ platformId: 'walk', end: at(7, 50) })], kept: [kept] });
  expect(moved.map((s) => [s.platformId, s.minutes])).toEqual([['walk', 50]]);
  const renamed = cardioSessionImports({ platform: [read({ platformId: 'walk', cardio: 'hiking' })], kept: [kept] });
  expect(renamed.map((s) => s.activity)).toEqual(['hiking']);
});

it('the same session recorded twice is kept once: a span overlapping 80% of one from another source is left out', () => {
  const watch = read({ platformId: 'watch-walk' });
  const phone = read({ platformId: 'phone-walk', start: at(7, 2), end: at(7, 44), sourceId: 'com.example.phone', sourceName: 'Phone' });
  expect(cardioSessionImports({ platform: [watch, phone], kept: [] }).map((s) => s.platformId)).toEqual(['watch-walk']);
  // Already kept from the watch: the phone's copy is left out on a later read too.
  const kept = new CardioSession({ platformId: 'watch-walk', sourceName: 'Watch', activity: 'walking', start: at(7), end: at(7, 42) });
  expect(cardioSessionImports({ platform: [phone], kept: [kept] })).toEqual([]);
  // Two sessions from one source never stand in for each other, and a short overlap is two sessions.
  const later = read({ platformId: 'watch-run', cardio: 'running', start: at(7, 35), end: at(8, 30) });
  expect(cardioSessionImports({ platform: [watch, later], kept: [] }).map((s) => s.platformId)).toEqual(['watch-walk', 'watch-run']);
  const phoneLater = read({ platformId: 'phone-run', cardio: 'running', start: new Date(at(7, 30).getTime() + 0 * minuteMs), end: at(9), sourceName: 'Phone' });
  expect(cardioSessionImports({ platform: [watch, phoneLater], kept: [] }).map((s) => s.platformId)).toEqual(['watch-walk', 'phone-run']);
});

it('the same platform id read twice in one read is kept once', () => {
  const changes = cardioSessionImports({ platform: [read({ platformId: 'walk' }), read({ platformId: 'walk' })], kept: [] });
  expect(changes).toHaveLength(1);
});
