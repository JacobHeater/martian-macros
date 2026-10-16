import { expect, it } from 'vitest';
import { megabytes } from '../../src/format/megabytes';

/** MM-345: a download smaller than a tenth of a megabyte says its kilobytes, never "0.0 MB". */
it('a small file says its kilobytes', () => {
  expect(megabytes(42_300)).toBe('42 kB');
  expect(megabytes(800)).toBe('1 kB');
  expect(megabytes(0)).toBe('0 kB');
});

it('a large one is as before', () => {
  expect(megabytes(800_000)).toBe('0.8 MB');
  expect(megabytes(46_739_747)).toBe('47 MB');
});
