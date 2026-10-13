import type { MigrationStep } from './MigrationStep';

/**
 * One step per released version, keyed by the version it upgrades *from*.
 * Step `n` takes a database at version `n` to version `n + 1`.
 */
export const migrationSteps: ReadonlyMap<number, MigrationStep> = new Map<number, MigrationStep>([
  // 1 to 2 (MM-242): which version of the terms of use was agreed to, and when.
  [
    1,
    async (db) => {
      await db.execute('ALTER TABLE user_preferences ADD COLUMN terms_accepted_version INTEGER NULL');
      await db.execute('ALTER TABLE user_preferences ADD COLUMN terms_accepted_epoch_day INTEGER NULL');
    },
  ],
]);
