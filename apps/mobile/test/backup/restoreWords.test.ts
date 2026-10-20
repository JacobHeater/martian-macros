import { expect, it } from 'vitest';
import type { BackupContents } from '../../src/domain/backup/BackupContents';
import { restoreWords } from '../../src/settings/restoreWords';
import { CalendarDate } from '../../src/domain/CalendarDate';

/** MM-63: the loss first, then what the backup holds; zero counts left out; a phone with nothing loses nothing. */
const contents = (over: Partial<BackupContents>): BackupContents => ({
  weighIns: 0,
  foodDays: 0,
  workouts: 0,
  customFoods: 0,
  from: undefined,
  to: undefined,
  hasSetup: false,
  ...over,
});

it('says the loss first, then the backup, leaving zero counts out', () => {
  const words = restoreWords(
    contents({ weighIns: 71, foodDays: 58, workouts: 12, from: CalendarDate.of(2026, 8, 1), to: CalendarDate.of(2026, 10, 12), hasSetup: true }),
    contents({ weighIns: 3, foodDays: 2, hasSetup: true }),
    'October 12, 2026',
  );
  expect(words.split('\n\n')).toEqual([
    'Restoring replaces everything on this phone: 3 weigh-ins, 2 days of food, your profile and your settings. It cannot be undone.',
    'The backup, made on October 12, 2026, holds 71 weigh-ins, 58 days of food, 12 workouts, August 1, 2026 to October 12, 2026.',
  ]);
});

it('a phone with nothing loses nothing, and a backup with no records says so', () => {
  const words = restoreWords(contents({}), contents({}), 'October 12, 2026');
  expect(words).toBe('This phone holds nothing yet, so nothing is lost.\n\nThe backup, made on October 12, 2026, holds no weigh-ins and no food.');
});
