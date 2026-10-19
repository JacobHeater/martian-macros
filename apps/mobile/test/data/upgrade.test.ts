import { expect, it } from 'vitest';
import { AppDatabase } from '../../src/data/AppDatabase';
import type { MigrationStep } from '../../src/data/MigrationStep';
import { currentSchema } from '../../src/data/currentSchema';
import { currentSchemaVersion as current } from '../../src/data/currentSchemaVersion';
import { SchemaMigrationError } from '../../src/data/SchemaMigrationError';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { StateError } from '../../src/lang/StateError';
import { SqlFailure } from '../../src/sql/SqlFailure';
import type { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
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
  const repos = new SqlRepositories(await AppDatabase.open(sql, { version: Number(await versionOf(sql)) }));
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
/** The schema as version 8 left it: without net carbs and sugar alcohols (MM-396, MM-397). */
const versionEight = currentSchema
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
