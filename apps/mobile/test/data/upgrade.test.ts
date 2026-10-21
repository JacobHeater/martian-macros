import { expect, it } from 'vitest';
import { AppDatabase } from '../../src/data/AppDatabase';
import type { MigrationStep } from '../../src/data/MigrationStep';
import { currentSchema } from '../../src/data/currentSchema';
import { currentSchemaVersion as current } from '../../src/data/currentSchemaVersion';
import { SchemaMigrationError } from '../../src/data/SchemaMigrationError';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CarbFatBalance } from '../../src/domain/CarbFatBalance';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { SleepNight } from '../../src/domain/SleepNight';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import { WeighInWindow } from '../../src/healthIngest/WeighInWindow';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { StateError } from '../../src/lang/StateError';
import { SqlFailure } from '../../src/sql/SqlFailure';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { first } from '../support/first';
import { openSql } from './support/openRepositories';

/**
 * MM-231: the schema starts again at version 1, so there is no released
 * upgrade to test yet. These prove the machinery with versions that do not
 * exist, before a feature depends on it, as the Dart tests did.
 */
const day = CalendarDate.of(2026, 10, 5);

/** The bytes of a database at the current version holding a setup and a weigh-in, as a file would. */
async function savedAtCurrent(): Promise<Uint8Array> {
  const sql = await openSql();
  const repos = await SqlRepositories.open(sql);
  await repos.setup.saveSetup(typicalSetup({ sex: 'female' }));
  await repos.weights.saveWeight(day, 80);
  return sql.exportBytes();
}

const addColumn =
  (name: string): MigrationStep =>
  (db) =>
    db.execute(`ALTER TABLE weight_entries ADD COLUMN ${name} TEXT NULL`);

const versionOf = async (sql: WasmSqlDatabase) => (await sql.select('PRAGMA user_version'))[0]?.['user_version'];

const columnsOf = async (sql: WasmSqlDatabase, table: string) =>
  (await sql.select(`PRAGMA table_info("${table}")`)).map((column) => column['name']);

async function expectDataIntact(sql: WasmSqlDatabase): Promise<void> {
  // Read with the current repositories: an added column does not disturb them.
  const repos = new SqlRepositories(await AppDatabase.open(sql, { version: Number(await versionOf(sql)) }), (bytes) => WasmSqlDatabase.open({ bytes }));
  expect((await repos.setup.loadSetup())?.profile.sex).toBe('female');
  expect((await first(repos.weights.watchWeights())).map((w) => [w.date, w.weightKg])).toEqual([[day, 80]]);
}

it('upgrading keeps every row and sets the new version', async () => {
  const sql = await openSql({ bytes: await savedAtCurrent() });
  await AppDatabase.open(sql, { version: current + 1, steps: new Map([[current, addColumn('note')]]) });
  await expectDataIntact(sql);
  expect(await versionOf(sql)).toBe(current + 1);
  expect(await columnsOf(sql, 'weight_entries')).toContain('note');
});

it('upgrading runs each step in turn when several versions behind', async () => {
  const sql = await openSql({ bytes: await savedAtCurrent() });
  const ran: number[] = [];
  const step =
    (at: number, column: string): MigrationStep =>
    async (db) => {
      ran.push(at);
      await addColumn(column)(db);
    };
  await AppDatabase.open(sql, {
    version: current + 2,
    steps: new Map([
      [current + 1, step(current + 1, 'second')],
      [current, step(current, 'first')],
    ]),
  });
  await expectDataIntact(sql);
  expect(ran).toEqual([current, current + 1]);
  expect(await versionOf(sql)).toBe(current + 2);
});

it('upgrading keeps the sex constraint', async () => {
  const sql = await openSql({ bytes: await savedAtCurrent() });
  await AppDatabase.open(sql, { version: current + 1, steps: new Map([[current, addColumn('note')]]) });
  await expect(sql.execute("UPDATE setups SET sex = 'other'")).rejects.toBeInstanceOf(SqlFailure);
});

it('a failed upgrade leaves the database as it was when a later step throws', async () => {
  const sql = await openSql({ bytes: await savedAtCurrent() });
  const broken = new Error('the second step broke');
  const failed = await AppDatabase.open(sql, {
    version: current + 2,
    steps: new Map<number, MigrationStep>([
      [current, addColumn('first')],
      [
        current + 1,
        async () => {
          throw broken;
        },
      ],
    ]),
  }).catch((error: unknown) => error);

  expect(failed).toBeInstanceOf(SchemaMigrationError);
  expect((failed as SchemaMigrationError).from).toBe(current);
  expect((failed as SchemaMigrationError).to).toBe(current + 2);
  expect((failed as SchemaMigrationError).cause).toBe(broken);
  expect((failed as SchemaMigrationError).message).toContain('Your data is safe and unchanged');
  expect(await versionOf(sql)).toBe(current);
  expect(await columnsOf(sql, 'weight_entries'), 'the first step is undone too').not.toContain('first');
  await expectDataIntact(sql);
});

it('an upgrade is refused when a step is missing', async () => {
  const sql = await openSql({ bytes: await savedAtCurrent() });
  const failed = await AppDatabase.open(sql, { version: current + 2, steps: new Map([[current, addColumn('first')]]) }).catch(
    (error: unknown) => error,
  );
  expect(failed).toBeInstanceOf(SchemaMigrationError);
  expect((failed as SchemaMigrationError).cause).toBeInstanceOf(StateError);
  expect(await versionOf(sql)).toBe(current);
  expect(await columnsOf(sql, 'weight_entries')).not.toContain('first');
  await expectDataIntact(sql);
});

it('data saved by a newer version of the app is refused and left alone', async () => {
  const newer = await openSql({ bytes: await savedAtCurrent() });
  await AppDatabase.open(newer, { version: current + 1, steps: new Map([[current, addColumn('note')]]) });

  const sql = await openSql({ bytes: await newer.exportBytes() });
  const failed = await AppDatabase.open(sql).catch((error: unknown) => error);
  expect(failed).toBeInstanceOf(SchemaMigrationError);
  expect((failed as SchemaMigrationError).message).toContain('saved by a newer version of the app');
  expect((failed as SchemaMigrationError).message).toContain('Update the app to open it');
  expect(await versionOf(sql)).toBe(current + 1);
  expect(await columnsOf(sql, 'weight_entries')).toContain('note');
});

/**
 * The schema as version 3 left it: without the micronutrients (the columns
 * after the food log's `created_at` and the custom foods' `cooked_weight_grams`),
 * the goals and the water log (MM-305).
 */
/** The schema as version 19 left it: without the pack food a recipe's ingredient was found as (MM-456). */
const versionNineteen = currentSchema.replace(
  '  "fat_g" REAL NOT NULL,\n  "source_pack_id" TEXT NULL,\n  "source_food_id" INTEGER NULL\n',
  '  "fat_g" REAL NOT NULL\n',
);

/** The schema as version 18 left it: without the weigh-in window (MM-441). */
const versionEighteen = versionNineteen
  .replace(
    '  "weigh_in_window_start_minute" INTEGER NULL CHECK ("weigh_in_window_start_minute" IS NULL OR "weigh_in_window_start_minute" BETWEEN 0 AND 1439),\n',
    '',
  )
  .replace(
    '  "weigh_in_window_end_minute" INTEGER NULL CHECK ("weigh_in_window_end_minute" IS NULL OR "weigh_in_window_end_minute" BETWEEN 1 AND 1440),\n',
    '',
  );

/** The schema as version 17 left it: without the weight-loss medication answer (MM-510). */
const versionSeventeen = versionEighteen.replace(
  '  "weight_loss_medication" INTEGER NOT NULL DEFAULT 0 CHECK ("weight_loss_medication" IN (0, 1)),\n',
  '',
);

/** The schema as version 16 left it: without the lean-gain pace, chosen or asked for (MM-480). */
const versionSixteen = versionSeventeen
  .replace(`  "lean_gain_pace" TEXT NOT NULL DEFAULT 'standard' CHECK ("lean_gain_pace" IN ('standard', 'slower')),\n`, '')
  .replace(`  "lean_gain_pace" TEXT NULL CHECK ("lean_gain_pace" IS NULL OR "lean_gain_pace" IN ('standard', 'slower')),\n`, '');

/** The schema as version 15 left it: without the target shapes (MM-486). */
const versionFifteen = versionSixteen.replace(/CREATE TABLE "target_shapes" \([\s\S]*?\n\);\n/, '');

/** The schema as version 14 left it: without the scale chosen as primary (MM-71). */
const versionFourteen = versionFifteen.replace('  "primary_scale_source_id" TEXT NULL,\n', '');

/**
 * The schema as version 13 left it: the version 14 shape without the state a
 * food was logged in, the conversion to grams and the usual cooking fat
 * (MM-167, MM-151, MM-152).
 */
const versionThirteen = versionFourteen
  .replace('  "preparation" TEXT NULL,\n', '')
  .replace('  "conversion_kind" TEXT NULL,\n', '')
  .split('  "sugar_alcohols_g" REAL NULL,\n  "conversion_factor" REAL NULL CHECK("conversion_factor" IS NULL OR "conversion_factor" > 0.0)\n);')
  .join('  "sugar_alcohols_g" REAL NULL\n);')
  .replace("  \"usual_cooking_fat\" TEXT NOT NULL DEFAULT 'oil',\n", '');

/** The schema as version 12 left it: without the sleep-disorder answer and the nights of sleep (MM-250, MM-251). */
const versionTwelve = versionThirteen
  .replace('  "sleep_disorder" INTEGER NOT NULL DEFAULT 0 CHECK ("sleep_disorder" IN (0, 1)),\n', '')
  .replace(/CREATE TABLE "sleep_nights" \([\s\S]*?\n\);\n/, '');

/** The schema as version 11 left it: without the online lookup choice and the foods found online (MM-58). */
const versionEleven = versionTwelve
  .replace(`  "online_lookup" TEXT NOT NULL DEFAULT 'ask' CHECK ("online_lookup" IN ('ask', 'always', 'never')),\n`, '')
  .replace(/CREATE TABLE "online_foods" \([\s\S]*?\n\);\nCREATE UNIQUE INDEX "online_foods_gtin" ON "online_foods" \("gtin"\);\n/, '');

/** The schema as version 10 left it: without exact targets, the label note, easing into maintenance, the pace change day, the maintenance anchor and correction (MM-123, MM-128, MM-130). */
const versionTen = versionEleven
  .replace('  "exact_targets" INTEGER NOT NULL DEFAULT 0 CHECK ("exact_targets" IN (0, 1)),\n', '')
  .replace('  "label_note_dismissed_epoch_day" INTEGER NULL,\n', '')
  .replace('  "ease_into_maintenance" INTEGER NOT NULL DEFAULT 0 CHECK ("ease_into_maintenance" IN (0, 1)),\n', '')
  .replace('  "pace_changed_epoch_day" INTEGER NULL,\n', '')
  .replace('  "maintenance_anchor_epoch_day" INTEGER NULL,\n', '')
  .replace('  "maintenance_correction_from_epoch_day" INTEGER NULL,\n', '')
  .replace('  "requested_loss_fraction" REAL NULL,\n  PRIMARY KEY ("effective_epoch_day")', '  PRIMARY KEY ("effective_epoch_day")')
  .replace(/CREATE TABLE "menstruation_days" \([\s\S]*?\n\);\n/, '');

/** The schema as version 9 left it: without the day of the last backup (MM-63). */
const versionNine = versionTen.replace('  "last_backup_epoch_day" INTEGER NULL,\n', '');

/** The schema as version 8 left it: without net carbs and sugar alcohols (MM-396, MM-397). */
const versionEight = versionNine
  .replace('  "net_carbs" INTEGER NOT NULL DEFAULT 1 CHECK ("net_carbs" IN (0, 1)),\n', '')
  .split('  "cholesterol_mg" REAL NULL,\n  "sugar_alcohols_g" REAL NULL\n);')
  .join('  "cholesterol_mg" REAL NULL\n);');

/** The schema as version 7 left it: without the snoozed inline insights (MM-378). */
const versionSeven = versionEight.replace(/CREATE TABLE "inline_insight_snoozes" \([\s\S]*?\n\);\n/, '');

/** The schema as version 6 left it: without the switches of Settings > Coach and the inline insight log (MM-363, MM-364). */
const versionSix = versionSeven
  .replace('  "inline_insights_off" INTEGER NOT NULL DEFAULT 0 CHECK ("inline_insights_off" IN (0, 1)),\n', '')
  .replace("  \"inline_insight_areas_off\" TEXT NOT NULL DEFAULT '',\n", '')
  .replace("  \"inline_insight_kinds_off\" TEXT NOT NULL DEFAULT '',\n", '')
  .replace(/CREATE TABLE "inline_insight_log" \([\s\S]*?\n\);\n/, '');

/** The schema as version 5 left it: without the fluid limit and the water goal switched off (MM-358, MM-359). */
const versionFive = versionSix
  .replace('  "fluid_limited_by_clinician" INTEGER NOT NULL DEFAULT 0 CHECK ("fluid_limited_by_clinician" IN (0, 1)),\n', '')
  .replace('  "water_goal_off" INTEGER NOT NULL DEFAULT 0 CHECK ("water_goal_off" IN (0, 1)),\n', '');

const versionThree = (() => {
  const foodEntries = /( {2}"created_at" INTEGER NOT NULL DEFAULT \(CAST\(strftime\('%s', CURRENT_TIMESTAMP\) AS INTEGER\)\)),\n[\s\S]*?\n\);/;
  const customFoods = / {2}"cooked_weight_grams" REAL NULL,\n[\s\S]*?\n\);/;
  return versionFive
    .replace(foodEntries, '$1\n);')
    .replace(customFoods, '  "cooked_weight_grams" REAL NULL\n);')
    .replace('  "sodium_limit_mg" INTEGER NULL,\n', '')
    .replace('  "sodium_limit_since_epoch_day" INTEGER NULL,\n', '')
    .replace('  "water_goal_ml" REAL NULL,\n', '')
    .replace(/CREATE TABLE "water_entries" \([\s\S]*?\n\);\n/, '');
})();

// MM-242: the first real step. A database as version 1 left it gains the two
// columns for the agreement to the terms, and keeps what it held.
it('a version 1 database comes up to date: nothing lost, and nobody has agreed to the terms yet', async () => {
  const versionOne = versionThree
    .replace('  "terms_accepted_version" INTEGER NULL,\n', '')
    .replace('  "terms_accepted_epoch_day" INTEGER NULL,\n', '')
    .replace("  \"macro_picture\" TEXT NOT NULL DEFAULT 'bars',\n", '');
  expect(versionOne).not.toContain('terms_accepted');
  expect(versionOne).not.toContain('macro_picture');
  const old = await openSql();
  await AppDatabase.open(old, { version: 1, schema: versionOne });
  await old.execute("INSERT INTO user_preferences (id, theme_preference) VALUES (1, 'dark')");
  expect(await columnsOf(old, 'user_preferences')).not.toContain('terms_accepted_version');

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  expect(await columnsOf(sql, 'user_preferences')).toEqual(
    expect.arrayContaining(['terms_accepted_version', 'terms_accepted_epoch_day', 'macro_picture']),
  );
  expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
  expect(await first(repos.preferences.watchTermsAcceptance())).toBeUndefined();
  // MM-254: the macro picture arrives as bars.
  expect(await first(repos.preferences.watchMacroPicture())).toBe('bars');
});

// MM-308, MM-311, MM-313: a version 3 database with food logged gains the
// micronutrient columns, the goals and the water log; its entries are kept
// and have no micronutrients, and both goals are off.
it('a version 3 database comes up to date: entries kept with no micronutrients, goals off, water empty', async () => {
  expect(versionThree).not.toContain('potassium_mg');
  expect(versionThree).not.toContain('water_entries');
  expect(versionThree).not.toContain('sodium_limit_mg');
  const old = await openSql();
  await AppDatabase.open(old, { version: 3, schema: versionThree });
  await old.execute(
    'INSERT INTO food_entries (epoch_day, meal, name, kcal, protein_g, carbs_g, fat_g, quantity_source, sodium_mg) ' +
      "VALUES (?, 'lunch', 'Soup', 300, 10, 40, 8, 'weighed', 900)",
    [day.epochDay],
  );
  await old.execute(
    'INSERT INTO custom_foods (name, kind, serving_description, serving_grams, kcal, protein_g, carbs_g, fat_g) ' +
      "VALUES ('Bar', 'food', '1 bar', 40, 200, 10, 20, 8)",
  );

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  const [soup] = await first(repos.food.watchFood(day));
  expect(soup?.name).toBe('Soup');
  expect(soup?.sodiumMg).toBe(900);
  expect(soup?.micros.of('potassium')).toBeUndefined();
  expect(soup?.micros.of('sodium')).toBe(900);
  expect((await first(repos.customFoods.watchCustomFoods())).map((f) => f.name)).toEqual(['Bar']);
  const goals = await first(repos.preferences.watchNutritionGoals());
  expect(goals.sodiumLimitMg).toBeUndefined();
  expect(goals.waterGoalMl).toBeUndefined();
  expect(await first(repos.water.watchWater(day))).toEqual([]);
});

// MM-325: version 4 changed after a build of it was installed. The build drawn
// for the panel (14aa735) made version 4 without the sodium limit's start day;
// on a phone that ran it, switching the limit on failed and sprang back.
it('a version 4 database from the build drawn for the panel can switch the sodium limit on', async () => {
  const old = await openSql();
  // Version 4 as 14aa735 left it: today's tables, less the one column.
  const firstVersionFour = versionFive.replace('  "sodium_limit_since_epoch_day" INTEGER NULL,\n', '');
  expect(firstVersionFour).not.toContain('sodium_limit_since_epoch_day');
  await AppDatabase.open(old, { version: 4, schema: firstVersionFour });

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  await repos.preferences.saveSodiumLimit(2300, day);
  const goals = await first(repos.preferences.watchNutritionGoals());
  expect(goals.sodiumLimitMg).toBe(2300);
  expect(goals.sodiumLimitSince).toBe(day);
});

it('a version 6 database comes up to date with every inline insight on and none logged', async () => {
  expect(versionSix).not.toContain('inline_insight');
  const old = await openSql();
  await AppDatabase.open(old, { version: 6, schema: versionSix });
  await old.execute("INSERT INTO user_preferences (id, theme_preference) VALUES (1, 'dark')");

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  const switches = await first(repos.preferences.watchInsightSwitches());
  expect(switches.all).toBe(true);
  expect([...switches.offAreas, ...switches.offKinds]).toEqual([]);
  expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
  expect(await first(repos.inlineInsightLog.watchInlineInsightLog({ since: day.addDays(-30) }))).toEqual([]);
});

it('a version 7 database comes up to date with nothing snoozed', async () => {
  expect(versionSeven).not.toContain('inline_insight_snoozes');
  const old = await openSql();
  await AppDatabase.open(old, { version: 7, schema: versionSeven });
  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await first(repos.insightSnoozes.watchInsightSnoozes())).toEqual([]);
});

// MM-396, MM-397: a version 8 database gains net carbs, on, and sugar alcohols on logged and saved foods;
// what was logged is kept, with no sugar-alcohol value.
it('a version 8 database comes up to date with net carbs on and its entries kept', async () => {
  expect(versionEight).not.toContain('net_carbs');
  expect(versionEight).not.toContain('sugar_alcohols_g');
  const old = await openSql();
  await AppDatabase.open(old, { version: 8, schema: versionEight });
  await old.execute("INSERT INTO user_preferences (id, theme_preference) VALUES (1, 'dark')");
  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  expect(await columnsOf(sql, 'food_entries')).toContain('sugar_alcohols_g');
  expect(await columnsOf(sql, 'custom_foods')).toContain('sugar_alcohols_g');
  expect(await first(repos.preferences.watchNetCarbs())).toBe(true);
});

it('a version 11 database comes up to date asking before any online lookup, with nothing found online yet (MM-58)', async () => {
  expect(versionEleven).not.toContain('online_lookup');
  expect(versionEleven).not.toContain('online_foods');
  const old = await openSql();
  await AppDatabase.open(old, { version: 11, schema: versionEleven });
  await old.execute("INSERT INTO user_preferences (id, theme_preference) VALUES (1, 'dark')");
  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  expect(await first(repos.preferences.watchOnlineLookup())).toBe('ask');
  expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
  expect(await columnsOf(sql, 'online_foods')).toContain('gtin');
  expect(await sql.select('SELECT count(*) AS n FROM online_foods')).toEqual([{ n: 0 }]);
});

// MM-250, MM-251: a version 12 database gains the sleep-disorder answer, "no", and an empty record of nights;
// its setup and weigh-ins are kept.
it('a version 12 database comes up to date with no sleep disorder and no nights recorded', async () => {
  expect(versionTwelve).not.toContain('sleep_disorder');
  expect(versionTwelve).not.toContain('sleep_nights');
  const old = await openSql();
  await AppDatabase.open(old, { version: 12, schema: versionTwelve });
  // Written as version 12 wrote them: today's repositories know the new column.
  await old.execute(
    'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, training_status, training_days_per_week, goal_mode, unit_system, onboarded_epoch_day) ' +
      "VALUES (1, 'female', ?, 180, 'novice', 3, 'fatLoss', 'imperial', ?)",
    [CalendarDate.of(1990, 1, 1).epochDay, CalendarDate.of(2026, 10, 1).epochDay],
  );
  await old.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [day.epochDay]);

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  await expectDataIntact(sql);
  expect(await columnsOf(sql, 'setups')).toContain('sleep_disorder');
  expect((await repos.setup.loadSetup())?.screening.sleepDisorder).toBe(false);
  expect(await first(repos.sleep.watchSleepNights())).toEqual([]);
  await repos.sleep.saveSleepNight(new SleepNight({ date: day, minutesAsleep: 440, source: 'typed' }));
  expect((await first(repos.sleep.watchSleepNights())).map((n) => n.minutesAsleep)).toEqual([440]);
});

// MM-167, MM-151, MM-152: a version 13 database comes up to date. What was logged keeps its
// totals, method and portion with no state or conversion invented, and the usual fat is oil.
it('a version 13 database comes up to date: entries kept with no preparation or conversion, the usual fat oil', async () => {
  expect(versionThirteen).not.toContain('preparation');
  expect(versionThirteen).not.toContain('conversion_');
  expect(versionThirteen).not.toContain('usual_cooking_fat');
  const old = await openSql();
  await AppDatabase.open(old, { version: 13, schema: versionThirteen });
  await old.execute(
    'INSERT INTO food_entries (epoch_day, meal, name, kcal, protein_g, carbs_g, fat_g, quantity_source, ' +
      'portion_quantity, portion_unit, nutrition_basis, reference_basis, reference_kcal, reference_protein_g, reference_carbs_g, reference_fat_g, ' +
      'origin_pack_id, origin_food_id, origin_source) ' +
      "VALUES (?, 'dinner', 'White rice, raw', 730, 14, 160, 1.4, 'weighed', 200, 'gram', 'calculated', 'per100g', 365, 7, 80, 0.7, 'fixture', 3, 'fixture')",
    [day.epochDay],
  );
  await old.execute("INSERT INTO user_preferences (id, theme_preference, detail_level) VALUES (1, 'dark', 'full')");

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  expect(await columnsOf(sql, 'food_entries')).toEqual(expect.arrayContaining(['preparation', 'conversion_kind', 'conversion_factor']));
  const [rice] = await first(repos.food.watchFood(day));
  expect(rice?.kcal).toBe(730);
  expect(rice?.portion?.quantity).toBe(200);
  expect(rice?.portion?.reference?.nutrition.kcal).toBe(365);
  expect(rice?.portion?.origin?.foodId).toBe(3);
  expect(rice?.portion?.preparation, 'nothing is invented').toBeUndefined();
  expect(rice?.portion?.conversion).toBeUndefined();
  expect(await repos.food.lastLoggedFrom('fixture', [3, 4]).then((e) => e?.name)).toBe('White rice, raw');
  expect(await first(repos.preferences.watchUsualCookingFat())).toBe('oil');
  expect(await first(repos.preferences.watchDetailLevel())).toBe('full');
  expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
});

// MM-71: a version 14 database comes up to date with no scale chosen, so the one with the most
// weigh-ins counts as before; its other preferences are kept, and a choice is kept from then on.
it('a version 14 database comes up to date with the primary scale chosen automatically', async () => {
  expect(versionFourteen).not.toContain('primary_scale_source_id');
  const old = await openSql();
  await AppDatabase.open(old, { version: 14, schema: versionFourteen });
  await old.execute(
    'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, training_status, training_days_per_week, goal_mode, unit_system, onboarded_epoch_day) ' +
      "VALUES (1, 'female', ?, 180, 'novice', 3, 'fatLoss', 'imperial', ?)",
    [CalendarDate.of(1990, 1, 1).epochDay, CalendarDate.of(2026, 10, 1).epochDay],
  );
  await old.execute("INSERT INTO user_preferences (id, theme_preference, usual_cooking_fat) VALUES (1, 'dark', 'butter')");
  await old.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [day.epochDay]);

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  await expectDataIntact(sql);
  expect(await columnsOf(sql, 'user_preferences')).toContain('primary_scale_source_id');
  expect(await first(repos.preferences.watchPrimaryScale()), 'none chosen: automatic').toBeUndefined();
  expect(await first(repos.preferences.watchUsualCookingFat())).toBe('butter');
  expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
  await repos.preferences.savePrimaryScale('gym');
  expect(await first(repos.preferences.watchPrimaryScale())).toBe('gym');
});

// MM-486: a version 15 database comes up to date with no shape set, so every day is Balanced and flat;
// what it held is kept, and a shape set from then on is kept with every field.
it('a version 15 database comes up to date with no target shape set, and keeps one set after', async () => {
  expect(versionFifteen).not.toContain('target_shapes');
  expect(versionFifteen).toContain('primary_scale_source_id');
  const old = await openSql();
  await AppDatabase.open(old, { version: 15, schema: versionFifteen });
  await old.execute(
    'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, training_status, training_days_per_week, goal_mode, unit_system, onboarded_epoch_day) ' +
      "VALUES (1, 'female', ?, 180, 'novice', 3, 'fatLoss', 'imperial', ?)",
    [CalendarDate.of(1990, 1, 1).epochDay, CalendarDate.of(2026, 10, 1).epochDay],
  );
  await old.execute("INSERT INTO user_preferences (id, theme_preference, primary_scale_source_id) VALUES (1, 'dark', 'gym')");
  await old.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [day.epochDay]);

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  await expectDataIntact(sql);
  expect(await columnsOf(sql, 'target_shapes')).toEqual(['since_epoch_day', 'fat_share', 'carb_floor_off', 'higher_days', 'raise_share']);
  expect(await first(repos.targetShapes.watchTargetShapes())).toEqual([]);
  expect(await first(repos.preferences.watchPrimaryScale())).toBe('gym');
  await repos.targetShapes.saveTargetShape(
    new TargetShape({
      since: day,
      balance: new CarbFatBalance({ fatShare: CarbFatBalance.moreFatFatShare }),
      week: new WeekShape({ higherDays: [6, 0], raise: 0.2 }),
    }),
  );
  const [shape] = await first(repos.targetShapes.watchTargetShapes());
  expect(shape?.since).toBe(day);
  expect(shape?.balance?.fatShare).toBe(CarbFatBalance.moreFatFatShare);
  expect([...(shape?.week.higherDays ?? [])]).toEqual([0, 6]);
  expect(shape?.week.raise).toBe(0.2);
});

// MM-480: a version 16 database comes up to date with the standard lean-gain pace, and its records of targets
// asked for none (the standard pace); what it held is kept, and a pace chosen from then on is kept.
it('a version 16 database comes up to date on the standard lean-gain pace, and keeps one chosen after', async () => {
  expect(versionSixteen).not.toContain('lean_gain_pace');
  expect(versionSixteen).toContain('target_shapes');
  const old = await openSql();
  await AppDatabase.open(old, { version: 16, schema: versionSixteen });
  await old.execute(
    'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, training_status, training_days_per_week, goal_mode, unit_system, onboarded_epoch_day) ' +
      "VALUES (1, 'female', ?, 180, 'intermediate', 4, 'leanGain', 'imperial', ?)",
    [CalendarDate.of(1990, 1, 1).epochDay, CalendarDate.of(2026, 10, 1).epochDay],
  );
  await old.execute(
    'INSERT INTO targets_history (effective_epoch_day, mode, kcal, protein_g, fat_g, carbs_g, weekly_rate_fraction, tdee_kcal, tdee_sigma_kcal, tdee_status) ' +
      "VALUES (?, 'leanGain', 2900, 150, 80, 340, 0.0015, 2700, 150, 'updated')",
    [day.epochDay],
  );
  await old.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [day.epochDay]);

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  await expectDataIntact(sql);
  const setup = await repos.setup.loadSetup();
  expect(setup?.goalMode).toBe('leanGain');
  expect(setup?.leanGainPace).toBe('standard');
  const [record] = await first(repos.targets.watchTargetsHistory());
  expect(record?.targets.kcal).toBe(2900);
  expect(record?.leanGainPace, 'none asked for: the standard pace').toBeUndefined();
  if (setup === undefined) throw new Error('No setup was loaded.');
  await repos.setup.saveSetup(setup.copyWith({ leanGainPace: 'slower' }));
  expect((await repos.setup.loadSetup())?.leanGainPace).toBe('slower');
});

// MM-510: a version 17 database comes up to date with the weight-loss medication answer not ticked; what it held
// is kept, the broader weight-affecting medication answer stays as it was, and a tick from then on is kept.
it('a version 17 database comes up to date with the weight-loss medication answer not ticked', async () => {
  expect(versionSeventeen).not.toContain('weight_loss_medication');
  expect(versionSeventeen).toContain('lean_gain_pace');
  const old = await openSql();
  await AppDatabase.open(old, { version: 17, schema: versionSeventeen });
  await old.execute(
    'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, training_status, training_days_per_week, goal_mode, unit_system, onboarded_epoch_day, weight_affecting_medication) ' +
      "VALUES (1, 'female', ?, 170, 'novice', 0, 'fatLoss', 'imperial', ?, 1)",
    [CalendarDate.of(1990, 1, 1).epochDay, CalendarDate.of(2026, 10, 1).epochDay],
  );
  await old.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [day.epochDay]);

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  await expectDataIntact(sql);
  expect(await columnsOf(sql, 'setups')).toContain('weight_loss_medication');
  const setup = await repos.setup.loadSetup();
  expect(setup?.screening.weightLossMedication).toBe(false);
  expect(setup?.screening.weightAffectingMedication, 'the broader answer is its own').toBe(true);
  if (setup === undefined) throw new Error('No setup was loaded.');
  await repos.setup.saveSetup(
    setup.copyWith({ screening: new ScreeningAnswers({ weightAffectingMedication: true, weightLossMedication: true }) }),
  );
  expect((await repos.setup.loadSetup())?.screening.weightLossMedication).toBe(true);
});

// MM-441: a version 18 database comes up to date with no weigh-in window chosen, so 04:00 to 12:00 counts as before;
// its other preferences are kept, and a window moved from then on is kept, to the minute and up to midnight.
it('a version 18 database comes up to date on the usual weigh-in window, and keeps one moved after', async () => {
  expect(versionEighteen).not.toContain('weigh_in_window');
  expect(versionEighteen).toContain('weight_loss_medication');
  const old = await openSql();
  await AppDatabase.open(old, { version: 18, schema: versionEighteen });
  await old.execute(
    'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, training_status, training_days_per_week, goal_mode, unit_system, onboarded_epoch_day) ' +
      "VALUES (1, 'female', ?, 170, 'novice', 3, 'fatLoss', 'imperial', ?)",
    [CalendarDate.of(1990, 1, 1).epochDay, CalendarDate.of(2026, 10, 1).epochDay],
  );
  await old.execute("INSERT INTO user_preferences (id, theme_preference, primary_scale_source_id) VALUES (1, 'dark', 'gym')");
  await old.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [day.epochDay]);

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  await expectDataIntact(sql);
  expect(await columnsOf(sql, 'user_preferences')).toEqual(
    expect.arrayContaining(['weigh_in_window_start_minute', 'weigh_in_window_end_minute']),
  );
  expect((await first(repos.weighInWindow.watchWeighInWindow())).equals(WeighInWindow.usual), 'none chosen: 04:00 to 12:00').toBe(true);
  expect(await first(repos.preferences.watchPrimaryScale())).toBe('gym');
  expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
  await repos.weighInWindow.saveWeighInWindow(new WeighInWindow({ startMinute: 14 * 60 + 5, endMinute: 24 * 60 }));
  const moved = await first(repos.weighInWindow.watchWeighInWindow());
  expect([moved.startMinute, moved.endMinute]).toEqual([14 * 60 + 5, 24 * 60]);
});

// MM-456: a version 19 database comes up to date with its recipes' lines kept and no source on any of them;
// a line saved from then on keeps the pack food it was found as.
it("a version 19 database comes up to date with recipe lines kept, sourceless, and keeps a line's food after", async () => {
  expect(versionNineteen).not.toContain('source_pack_id');
  expect(versionNineteen).toContain('weigh_in_window_start_minute');
  const old = await openSql();
  await AppDatabase.open(old, { version: 19, schema: versionNineteen });
  await old.execute(
    'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, training_status, training_days_per_week, goal_mode, unit_system, onboarded_epoch_day) ' +
      "VALUES (1, 'female', ?, 170, 'novice', 3, 'fatLoss', 'imperial', ?)",
    [CalendarDate.of(1990, 1, 1).epochDay, CalendarDate.of(2026, 10, 1).epochDay],
  );
  await old.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [day.epochDay]);
  await old.execute(
    'INSERT INTO custom_foods (id, name, kind, serving_description, kcal, protein_g, carbs_g, fat_g, servings) ' +
      "VALUES (1, 'Rice bowl', 'recipe', '1 serving', 365, 7, 80, 0.7, 2)",
  );
  await old.execute(
    'INSERT INTO recipe_ingredients (recipe_id, position, name, grams, kcal, protein_g, carbs_g, fat_g) ' +
      "VALUES (1, 0, 'White rice, raw', 200, 730, 14, 160, 1.4)",
  );

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  await expectDataIntact(sql);
  expect(await columnsOf(sql, 'recipe_ingredients')).toEqual(expect.arrayContaining(['source_pack_id', 'source_food_id']));
  const [bowl] = await first(repos.customFoods.watchCustomFoods());
  const [line] = bowl?.ingredients ?? [];
  expect(line?.name).toBe('White rice, raw');
  expect(line?.grams).toBe(200);
  expect(line?.totals.kcal).toBe(730);
  expect(line?.source, 'what was saved before knows no source').toBeUndefined();
  if (bowl === undefined || line === undefined) throw new Error('No recipe was read.');
  await repos.customFoods.saveCustomFood(new CustomFood({ ...bowl, ingredients: [{ ...line, source: { packId: 'fixture', foodId: 3 } }] }));
  const [kept] = (await first(repos.customFoods.watchCustomFoods()))[0]?.ingredients ?? [];
  expect(kept?.source).toEqual({ packId: 'fixture', foodId: 3 });
});
