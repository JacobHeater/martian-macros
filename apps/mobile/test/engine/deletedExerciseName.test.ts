import { expect, it } from 'vitest';
import { StrengthTrend } from '../../src/engine/StrengthTrend';

/** MM-348: a lift whose exercise was deleted is named for the person, never by its internal id. */
it.skip('MM-348: a deleted exercise is not named by its id', () => {
  const trend = new StrengthTrend({ exercise: undefined, exerciseId: 'custom-1f3a9c', points: [], loggedSessions: 2, recentSessions: 0 });
  expect(trend.name).not.toContain('custom-1f3a9c');
});
