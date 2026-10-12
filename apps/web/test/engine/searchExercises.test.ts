import { expect, it } from 'vitest';
import { builtInExercises, Exercise } from '../../src/domain';
import { searchExercises } from '../../src/engine';
import { compareStrings } from '../../src/lang/compareStrings';

/** MM-76: choosing an exercise, by search and with recent ones first. */
const names = (
  query: string,
  { recentIds = [], exercises = builtInExercises }: { recentIds?: string[]; exercises?: readonly Exercise[] } = {},
) => searchExercises({ query, exercises, recentIds }).map((e) => e.name);

it('"bench" finds the bench presses and their incline variants', () => {
  const found = names('bench');
  for (const name of [
    'Barbell bench press',
    'Dumbbell bench press',
    'Incline barbell bench press',
    'Incline dumbbell bench press',
  ]) {
    expect(found).toContain(name);
  }
});

it('every word typed must begin a word of the name', () => {
  const found = names('inc bench');
  expect(found.length).toBeGreaterThan(0);
  for (const name of found) {
    expect(name).toContain('ncline');
    expect(name).toContain('bench');
  }
});

it('it does not matter how it is capitalized or spaced', () => {
  expect(names('  BENCH   press ')).toEqual(names('bench press'));
});

it('hyphens and apostrophes do not have to be typed', () => {
  expect(names('pull up')).toContain('Pull-up');
  expect(names('farmers')).toContain("Farmer's carry");
  expect(names('t bar')).toContain('T-bar row');
});

it('names starting with what was typed come before other matches', () => {
  const found = names('leg');
  const startsWithLeg = (name: string) => name.toLowerCase().startsWith('leg');
  const firstOther = found.findIndex((name) => !startsWithLeg(name));
  const lastStarting = found.map(startsWithLeg).lastIndexOf(true);
  expect(lastStarting).toBeGreaterThanOrEqual(0);
  expect(firstOther).toBeGreaterThan(lastStarting);
});

it('nothing matching is an empty list', () => {
  expect(names('zzz')).toEqual([]);
});

it('with nothing typed, everything is offered, by name', () => {
  const found = names('');
  expect(found).toHaveLength(builtInExercises.length);
  const sorted = [...found].sort((a, b) => compareStrings(a.toLowerCase(), b.toLowerCase()));
  expect(found).toEqual(sorted);
});

it('recently used exercises come first, most recent first', () => {
  const found = names('', { recentIds: ['back-squat', 'pull-up'] });
  expect(found.slice(0, 2)).toEqual(['Back squat', 'Pull-up']);
  expect(found).toHaveLength(builtInExercises.length);
});

it('a recent exercise leads its search results too', () => {
  const found = names('press', { recentIds: ['leg-press'] });
  expect(found[0]).toBe('Leg press');
});

it('a recent exercise that does not match is not shown', () => {
  expect(names('curl', { recentIds: ['back-squat'] })).not.toContain('Back squat');
});

it("the user's own exercises are searched with the library", () => {
  const landmine = new Exercise({
    id: 'custom-1',
    name: 'Landmine press',
    equipment: 'barbell',
    primary: 'shoulders',
  });
  expect(names('landmine', { exercises: [...builtInExercises, landmine] })).toEqual(['Landmine press']);
});
