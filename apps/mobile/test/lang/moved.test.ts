import { expect, it } from 'vitest';
import { moved } from '../../src/lang/moved';

/** MM-45: a recipe's ingredients are put in order one place at a time. */
it('moves one item and keeps the others in order', () => {
  expect(moved(['a', 'b', 'c', 'd'], 2, 1)).toEqual(['a', 'c', 'b', 'd']);
  expect(moved(['a', 'b', 'c', 'd'], 0, 3)).toEqual(['b', 'c', 'd', 'a']);
});

it('leaves the list as it is for a place outside it', () => {
  const items = ['a', 'b'];
  expect(moved(items, 0, -1)).toBe(items);
  expect(moved(items, 1, 2)).toBe(items);
  expect(moved(items, 1, 1)).toBe(items);
});
