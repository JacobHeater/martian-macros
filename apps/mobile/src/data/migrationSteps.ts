import { Micronutrient } from '../domain/food/micros/Micronutrient';
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
  // 2 to 3 (MM-254): which macro picture the hero shows, bars or donut.
  [
    2,
    async (db) => {
      await db.execute("ALTER TABLE user_preferences ADD COLUMN macro_picture TEXT NOT NULL DEFAULT 'bars'");
    },
  ],
  // 3 to 4 (MM-308, MM-309, MM-311, MM-313): micronutrients on entries and own
  // foods, the sodium limit and the water goal, and the water log.
  [
    3,
    async (db) => {
      for (const column of Micronutrient.added.map((n) => Micronutrient.column(n))) {
        await db.execute(`ALTER TABLE food_entries ADD COLUMN ${column} REAL NULL`);
      }
      for (const column of ['fiber_g', ...Micronutrient.values.map((n) => Micronutrient.column(n))]) {
        await db.execute(`ALTER TABLE custom_foods ADD COLUMN ${column} REAL NULL`);
      }
      await db.execute('ALTER TABLE user_preferences ADD COLUMN sodium_limit_mg INTEGER NULL');
      await db.execute('ALTER TABLE user_preferences ADD COLUMN sodium_limit_since_epoch_day INTEGER NULL');
      await db.execute('ALTER TABLE user_preferences ADD COLUMN water_goal_ml REAL NULL');
      await db.execute(
        'CREATE TABLE "water_entries" (' +
          '"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
          '"epoch_day" INTEGER NOT NULL, ' +
          '"ml" REAL NOT NULL CHECK("ml" > 0.0 AND "ml" <= 3000.0), ' +
          '"at_ms" INTEGER NOT NULL)',
      );
    },
  ],
  // 4 to 5 (MM-325): version 4 changed after a build of it was installed. The
  // build drawn for the panel made it without the sodium limit's start day;
  // a database from that build gains the column, one from any later build
  // already has it.
  [
    4,
    async (db) => {
      const columns = await db.select('PRAGMA table_info("user_preferences")');
      if (!columns.some((column) => column['name'] === 'sodium_limit_since_epoch_day')) {
        await db.execute('ALTER TABLE user_preferences ADD COLUMN sodium_limit_since_epoch_day INTEGER NULL');
      }
    },
  ],
  // 5 to 6 (MM-358, MM-359): whether a clinician limits what the person drinks,
  // and whether the water goal, now on by default, was switched off. Both "no".
  [
    5,
    async (db) => {
      await db.execute(
        'ALTER TABLE setups ADD COLUMN fluid_limited_by_clinician INTEGER NOT NULL DEFAULT 0 ' +
          'CHECK (fluid_limited_by_clinician IN (0, 1))',
      );
      await db.execute(
        'ALTER TABLE user_preferences ADD COLUMN water_goal_off INTEGER NOT NULL DEFAULT 0 CHECK (water_goal_off IN (0, 1))',
      );
    },
  ],
  // 6 to 7 (MM-363, MM-364): the switches of Settings > Coach, all on, and the
  // log of inline insights shown.
  [
    6,
    async (db) => {
      await db.execute(
        'ALTER TABLE user_preferences ADD COLUMN inline_insights_off INTEGER NOT NULL DEFAULT 0 ' +
          'CHECK (inline_insights_off IN (0, 1))',
      );
      await db.execute("ALTER TABLE user_preferences ADD COLUMN inline_insight_areas_off TEXT NOT NULL DEFAULT ''");
      await db.execute("ALTER TABLE user_preferences ADD COLUMN inline_insight_kinds_off TEXT NOT NULL DEFAULT ''");
      await db.execute(
        'CREATE TABLE "inline_insight_log" (' +
          '"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
          '"kind" TEXT NOT NULL, ' +
          '"area" TEXT NOT NULL, ' +
          '"anchor_kind" TEXT NOT NULL, ' +
          '"anchor_id" TEXT NOT NULL, ' +
          '"item" TEXT NOT NULL, ' +
          '"line" TEXT NOT NULL, ' +
          '"first_epoch_day" INTEGER NOT NULL, ' +
          'UNIQUE ("kind", "anchor_kind", "anchor_id"))',
      );
    },
  ],
  // 7 to 8 (MM-378): the inline insights snoozed, one kind on one item.
  [
    7,
    async (db) => {
      await db.execute(
        'CREATE TABLE "inline_insight_snoozes" (' +
          '"kind" TEXT NOT NULL, ' +
          '"subject" TEXT NOT NULL, ' +
          '"item" TEXT NOT NULL, ' +
          '"resumes_epoch_day" INTEGER NULL, ' +
          'PRIMARY KEY ("kind", "subject"))',
      );
    },
  ],
]);
