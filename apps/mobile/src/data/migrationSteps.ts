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
  // 8 to 9 (MM-396, MM-397): carbs shown as net unless switched off; sugar alcohols on logged and saved foods.
  [
    8,
    async (db) => {
      await db.execute('ALTER TABLE user_preferences ADD COLUMN net_carbs INTEGER NOT NULL DEFAULT 1 CHECK (net_carbs IN (0, 1))');
      await db.execute('ALTER TABLE food_entries ADD COLUMN sugar_alcohols_g REAL NULL');
      await db.execute('ALTER TABLE custom_foods ADD COLUMN sugar_alcohols_g REAL NULL');
    },
  ],
  // 9 to 10 (MM-63): the day the last backup was made.
  [
    9,
    async (db) => {
      await db.execute('ALTER TABLE user_preferences ADD COLUMN last_backup_epoch_day INTEGER NULL');
    },
  ],
  // 10 to 11 (MM-123, MM-128, MM-130): exact targets and the label note; the day a pace was chosen; the maintenance anchor and correction.
  [
    10,
    async (db) => {
      await db.execute(
        'ALTER TABLE user_preferences ADD COLUMN exact_targets INTEGER NOT NULL DEFAULT 0 CHECK (exact_targets IN (0, 1))',
      );
      await db.execute('ALTER TABLE user_preferences ADD COLUMN label_note_dismissed_epoch_day INTEGER NULL');
      await db.execute(
        'ALTER TABLE user_preferences ADD COLUMN ease_into_maintenance INTEGER NOT NULL DEFAULT 0 CHECK (ease_into_maintenance IN (0, 1))',
      );
      await db.execute('ALTER TABLE setups ADD COLUMN pace_changed_epoch_day INTEGER NULL');
      await db.execute('ALTER TABLE setups ADD COLUMN maintenance_anchor_epoch_day INTEGER NULL');
      await db.execute('ALTER TABLE setups ADD COLUMN maintenance_correction_from_epoch_day INTEGER NULL');
      await db.execute('ALTER TABLE targets_history ADD COLUMN requested_loss_fraction REAL NULL');
      // MM-20: the days marked with menstrual flow.
      await db.execute('CREATE TABLE "menstruation_days" ("epoch_day" INTEGER NOT NULL, PRIMARY KEY ("epoch_day"))');
    },
  ],
  // 11 to 12 (MM-58): whether unknown foods may be looked up online, and the foods found online, kept on the phone.
  [
    11,
    async (db) => {
      await db.execute(
        "ALTER TABLE user_preferences ADD COLUMN online_lookup TEXT NOT NULL DEFAULT 'ask' CHECK (\"online_lookup\" IN ('ask', 'always', 'never'))",
      );
      await db.execute(
        'CREATE TABLE "online_foods" (' +
          '"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
          '"gtin" TEXT NULL, ' +
          '"name" TEXT NOT NULL, ' +
          '"brand" TEXT NULL, ' +
          '"kcal" REAL NOT NULL CHECK("kcal" >= 0.0), ' +
          '"protein_g" REAL NOT NULL CHECK("protein_g" >= 0.0), ' +
          '"carbs_g" REAL NOT NULL CHECK("carbs_g" >= 0.0), ' +
          '"fat_g" REAL NOT NULL CHECK("fat_g" >= 0.0), ' +
          '"fiber_g" REAL NULL, ' +
          '"sugar_alcohols_g" REAL NULL, ' +
          '"sodium_mg" REAL NULL, ' +
          '"alcohol_g" REAL NULL, ' +
          '"micros" TEXT NOT NULL DEFAULT \'{}\', ' +
          '"servings" TEXT NOT NULL DEFAULT \'[]\', ' +
          '"source" TEXT NOT NULL, ' +
          '"source_id" TEXT NULL, ' +
          '"tier" INTEGER NOT NULL, ' +
          '"tier_reason" TEXT NOT NULL' +
          ')',
      );
      await db.execute('CREATE UNIQUE INDEX "online_foods_gtin" ON "online_foods" ("gtin")');
    },
  ],
  // 12 to 13 (MM-250, MM-251): a diagnosed sleep disorder in the health check, and the nights of sleep.
  [
    12,
    async (db) => {
      await db.execute(
        'ALTER TABLE setups ADD COLUMN sleep_disorder INTEGER NOT NULL DEFAULT 0 CHECK (sleep_disorder IN (0, 1))',
      );
      await db.execute(
        'CREATE TABLE "sleep_nights" (' +
          '"epoch_day" INTEGER NOT NULL, ' +
          '"minutes_asleep" REAL NOT NULL CHECK("minutes_asleep" > 0.0 AND "minutes_asleep" <= 1440.0), ' +
          '"source" TEXT NOT NULL CHECK("source" IN (\'typed\', \'imported\')), ' +
          '"source_name" TEXT NULL, ' +
          'PRIMARY KEY ("epoch_day"))',
      );
    },
  ],
  // 13 to 14 (MM-167, MM-151, MM-152): the state a food was logged in and the
  // conversion that made its unit grams, both unknown for what is already
  // logged; and the fat the person usually cooks with, oil until chosen.
  [
    13,
    async (db) => {
      await db.execute('ALTER TABLE food_entries ADD COLUMN preparation TEXT NULL');
      await db.execute('ALTER TABLE food_entries ADD COLUMN conversion_kind TEXT NULL');
      await db.execute(
        'ALTER TABLE food_entries ADD COLUMN conversion_factor REAL NULL CHECK (conversion_factor IS NULL OR conversion_factor > 0.0)',
      );
      await db.execute("ALTER TABLE user_preferences ADD COLUMN usual_cooking_fat TEXT NOT NULL DEFAULT 'oil'");
    },
  ],
  // 14 to 15 (MM-71): the scale chosen as primary in Settings, none (automatic) until chosen.
  [
    14,
    async (db) => {
      await db.execute('ALTER TABLE user_preferences ADD COLUMN primary_scale_source_id TEXT NULL');
    },
  ],
  // 15 to 16 (MM-486): how the user shapes their targets (MM-122, MM-124), one row per day a shape was
  // set from; none yet, so every day is Balanced and flat.
  [
    15,
    async (db) => {
      await db.execute(
        'CREATE TABLE "target_shapes" (' +
          '"since_epoch_day" INTEGER NOT NULL, ' +
          '"fat_share" REAL NULL CHECK("fat_share" IS NULL OR "fat_share" BETWEEN 0.2 AND 0.4), ' +
          '"carb_floor_off" INTEGER NOT NULL DEFAULT 0 CHECK ("carb_floor_off" IN (0, 1)), ' +
          '"higher_days" TEXT NOT NULL DEFAULT \'\', ' +
          '"raise_share" REAL NOT NULL CHECK("raise_share" > 0.0 AND "raise_share" < 1.0), ' +
          'PRIMARY KEY ("since_epoch_day"))',
      );
    },
  ],
  // 16 to 17 (MM-480): the lean-gain pace chosen, standard until chosen, and the pace each record of targets was
  // asked for, none on what is already there (the standard pace).
  [
    16,
    async (db) => {
      await db.execute(
        "ALTER TABLE setups ADD COLUMN lean_gain_pace TEXT NOT NULL DEFAULT 'standard' CHECK (\"lean_gain_pace\" IN ('standard', 'slower'))",
      );
      await db.execute(
        "ALTER TABLE targets_history ADD COLUMN lean_gain_pace TEXT NULL CHECK (\"lean_gain_pace\" IS NULL OR \"lean_gain_pace\" IN ('standard', 'slower'))",
      );
    },
  ],
  // 17 to 18 (MM-510): the answer "I take a prescription weight-loss medication" (MM-113), kept apart from the
  // broader weight-affecting medication answer; not ticked on what is already there.
  [
    17,
    async (db) => {
      await db.execute(
        'ALTER TABLE setups ADD COLUMN weight_loss_medication INTEGER NOT NULL DEFAULT 0 CHECK (weight_loss_medication IN (0, 1))',
      );
    },
  ],
]);
