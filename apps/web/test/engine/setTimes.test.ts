import { expect, it } from 'vitest';
import { WorkoutSet } from '../../src/domain';
import { checkSetTimes } from '../../src/engine';

const base = new Date(2026, 9, 5, 18);
const at = (minute: number) => new Date(base.getTime() + minute * 60 * 1000);
const when = (minute: number | undefined) => (minute === undefined ? undefined : at(minute));

const set = (start: number | undefined, end: number | undefined) =>
  new WorkoutSet({ reps: 8, loadKg: 100, startedAt: when(start), endedAt: when(end) });

const check = (start: number | undefined, end: number | undefined, others: WorkoutSet[]) =>
  checkSetTimes({ start: when(start), end: when(end), otherSets: others, notBefore: base, notAfter: at(60) });

it('MM-196 refuses intersecting intervals and either containment', () => {
  const others = [set(2, 4)];
  expect(check(1, 3, others)).toBe('overlappingSet');
  expect(check(3, 5, others)).toBe('overlappingSet');
  expect(check(1, 5, others)).toBe('overlappingSet');
  expect(check(2, 3, others)).toBe('overlappingSet');
  expect(check(2, 4, others)).toBe('overlappingSet');
});

it('adjacent or disjoint intervals are allowed in either order', () => {
  const others = [set(2, 4)];
  expect(check(0, 2, others)).toBeUndefined();
  expect(check(4, 5, others)).toBeUndefined();
  expect(check(6, 8, others)).toBeUndefined();
  expect(check(2, 4, [set(4, 5), set(0, 2)])).toBeUndefined();
});

it('a partial candidate conflicts only inside a complete interval', () => {
  const others = [set(2, 4)];
  expect(check(3, undefined, others)).toBe('overlappingSet');
  expect(check(undefined, 3, others)).toBe('overlappingSet');
  expect(check(undefined, 2, others)).toBeUndefined();
  expect(check(4, undefined, others)).toBeUndefined();
  expect(check(undefined, undefined, others)).toBeUndefined();
});

it('a complete candidate cannot contain another known timestamp', () => {
  expect(check(2, 4, [set(3, undefined)])).toBe('overlappingSet');
  expect(check(2, 4, [set(undefined, 3)])).toBe('overlappingSet');
  expect(check(2, 4, [set(undefined, 2), set(4, undefined)])).toBeUndefined();
});

it('missing times do not invent ranges or conflicts between points', () => {
  const others = [set(undefined, undefined), set(undefined, 3), set(5, undefined)];
  expect(check(3, 5, others)).toBeUndefined();
  expect(check(4, undefined, others)).toBeUndefined();
  expect(check(undefined, 4, others)).toBeUndefined();
  expect(check(undefined, 3, others)).toBeUndefined();
});

it('bounds and ordering retain their existing refusal reasons', () => {
  expect(check(4, 3, [set(2, 5)])).toBe('endNotAfterStart');
  expect(check(-1, 3, [set(2, 5)])).toBe('tooEarly');
  expect(check(3, 61, [set(2, 5)])).toBe('tooLate');
  expect(check(0, 60, [])).toBeUndefined();
});
