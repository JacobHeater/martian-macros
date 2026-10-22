import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrient } from '../../src/domain/food/micros/Micronutrient';
import { WeighInWindow } from '../../src/healthIngest/WeighInWindow';
import { AppDatabase } from '../../src/data/AppDatabase';
import { currentSchemaVersion } from '../../src/data/currentSchemaVersion';
import { tables } from '../../src/data/tables';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { SqlFailure } from '../../src/sql/SqlFailure';
import { first } from '../support/first';
import dartTables from './support/dartSchemaV31.json';
import { openSql } from './support/openRepositories';

/**
 * What the database itself enforces, independent of any repository. The
 * repository behavior is in the contract suites (sqlContracts.test.ts).
 */
const day = CalendarDate.of(2026, 10, 5);

async function opened() {
  const sql = await openSql();
  return { sql, repos: await SqlRepositories.open(sql) };
}

/** The columns added since the Dart database's last version, after the ones it had, by table and in order. */
const addedSince: Readonly<Record<string, readonly string[]>> = {
  // Version 2 (MM-242): the agreement to the terms of use. Version 3 (MM-254): the macro picture.
  // Version 4 (MM-311, MM-313): the sodium limit and the water goal. Version 6 (MM-358): the goal switched off.
  // Version 7 (MM-364): the switches of Settings > Coach. Version 9 (MM-396): net carbs. Version 10 (MM-63): the last backup.
  // Version 11 (MM-123, MM-130): exact targets, the label note, easing into maintenance. Version 12 (MM-58): the online lookup choice. Version 14 (MM-152): the usual cooking fat.
  // Version 15 (MM-71): the scale chosen as primary. Version 19 (MM-441): the weigh-in window.
  user_preferences: [
    'terms_accepted_version',
    'terms_accepted_epoch_day',
    'macro_picture',
    'sodium_limit_mg',
    'sodium_limit_since_epoch_day',
    'water_goal_ml',
    'water_goal_off',
    'inline_insights_off',
    'inline_insight_areas_off',
    'inline_insight_kinds_off',
    'net_carbs',
    'last_backup_epoch_day',
    'exact_targets',
    'label_note_dismissed_epoch_day',
    'ease_into_maintenance',
    'online_lookup',
    'usual_cooking_fat',
    'primary_scale_source_id',
    'weigh_in_window_start_minute',
    'weigh_in_window_end_minute',
  ],
  // Version 6 (MM-359): a clinician's limit on what the person drinks. Version 11 (MM-128, MM-130): the pace change day, the maintenance anchor and correction.
  // Version 13 (MM-251): a diagnosed sleep disorder. Version 17 (MM-480): the lean-gain pace chosen.
  // Version 18 (MM-510): the weight-loss medication answer (MM-113).
  setups: [
    'fluid_limited_by_clinician',
    'pace_changed_epoch_day',
    'maintenance_anchor_epoch_day',
    'maintenance_correction_from_epoch_day',
    'sleep_disorder',
    'lean_gain_pace',
    'weight_loss_medication',
  ],
  // Version 11 (MM-128): the pace each record of targets was asked for. Version 17 (MM-480): the lean-gain one.
  targets_history: ['requested_loss_fraction', 'lean_gain_pace'],
  // Version 4 (MM-308): the micronutrients a food log entry keeps. Version 9 (MM-397): sugar alcohols.
  // Version 15 (MM-167, MM-151): the state the food was logged in and the conversion that made its unit grams.
  food_entries: [
    ...Micronutrient.added.map((n) => Micronutrient.column(n)),
    'sugar_alcohols_g',
    'preparation',
    'conversion_kind',
    'conversion_factor',
  ],
  // Version 4 (MM-309): fiber, sodium and the micronutrients of a food of one's own.
  custom_foods: ['fiber_g', ...Micronutrient.values.map((n) => Micronutrient.column(n)), 'sugar_alcohols_g'],
  // Version 20 (MM-456): the pack food a recipe's ingredient was found as.
  recipe_ingredients: ['source_pack_id', 'source_food_id'],
  // Version 22 (MM-490): the platform id and source of a workout imported from the health platform.
  workouts: ['platform_id', 'platform_source_name'],
};

/** The tables added since the Dart database's last version. */
const tablesAddedSince: readonly string[] = [
  // Version 4 (MM-313): the water log.
  'water_entries',
  // Version 7 (MM-363): the inline insights shown.
  'inline_insight_log',
  // Version 8 (MM-378): the inline insights snoozed.
  'inline_insight_snoozes',
  // Version 11 (MM-20): the days marked with menstrual flow.
  'menstruation_days',
  // Version 12 (MM-58): the foods found online, kept on the phone.
  'online_foods',
  // Version 13 (MM-250): the nights of sleep.
  'sleep_nights',
  // Version 16 (MM-486): how the user shapes their targets (MM-122, MM-124).
  'target_shapes',
  // Version 21 (MM-507): the goal body fat the user set (MM-36).
  'goal_body_fat',
  // Version 22 (MM-490): the imported workouts deleted in the app.
  'deleted_platform_workouts',
  // Version 23 (MM-156): every body measurement by site, and which sites are measured.
  'body_measurements',
  'measurement_settings',
];

/** The Dart database's tables since removed. */
const tablesRemovedSince: readonly string[] = [
  // Version 23 (MM-156): the waist moved into the measurements of every site.
  'waist_entries',
];

// MM-231: `dartSchemaV31.json` is every column of every table as the Dart
// app's database declared it at its last version, written by that database
// on 2026-10-12. Anything since is named in `addedSince`, and nothing else.
it('every table has the columns the Dart database had, in the same order, of the same kind, then what was added', async () => {
  const { sql } = await opened();
  expect([...tables].sort()).toEqual(
    [...Object.keys(dartTables).filter((table) => !tablesRemovedSince.includes(table)), ...tablesAddedSince].sort(),
  );
  for (const [table, columns] of Object.entries(dartTables)) {
    if (tablesRemovedSince.includes(table)) continue;
    const found = await sql.select(`PRAGMA table_info("${table}")`);
    expect(found.slice(0, columns.length), table).toEqual(columns);
    expect(found.slice(columns.length).map((column) => column['name']), table).toEqual(addedSince[table] ?? []);
  }
});

it('a new database is at the current version, and opening it again keeps what it holds', async () => {
  const { sql, repos } = await opened();
  expect((await sql.select('PRAGMA user_version'))[0]?.['user_version']).toBe(currentSchemaVersion);
  await repos.weights.saveWeight(day, 80);

  const bytes = await sql.exportBytes();
  const again = await SqlRepositories.open(await openSql({ bytes }));
  expect((await first(again.weights.watchWeights())).map((w) => w.weightKg)).toEqual([80]);
});

it('the schema itself rejects any sex outside the binary', async () => {
  const { sql, repos } = await opened();
  await repos.setup.saveSetup(typicalSetup({ sex: 'female' }));
  for (const bad of ['other', 'unknown', '', 'Male']) {
    await expect(sql.execute('UPDATE setups SET sex = ?', [bad]), `sex = "${bad}"`).rejects.toBeInstanceOf(SqlFailure);
  }
  await expect(sql.execute('UPDATE setups SET sex = NULL')).rejects.toBeInstanceOf(SqlFailure);
  expect((await repos.setup.loadSetup())?.profile.sex).toBe('female');
});

it('the schema allows only one setup row', async () => {
  const { sql, repos } = await opened();
  await repos.setup.saveSetup(typicalSetup());
  await expect(
    sql.execute(
      'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, ' +
        'training_status, training_days_per_week, goal_mode, unit_system, ' +
        'onboarded_epoch_day) ' +
        "VALUES (2, 'male', 0, 180, 'novice', 3, 'recomp', 'metric', 0)",
    ),
  ).rejects.toBeInstanceOf(SqlFailure);
});

it('rejects impossible weights', async () => {
  const { repos } = await opened();
  await expect(repos.weights.saveWeight(day, 5)).rejects.toBeInstanceOf(SqlFailure);
  expect(await first(repos.weights.watchWeights())).toEqual([]);
});

it('rejects impossible waist measurements', async () => {
  const { repos } = await opened();
  await expect(repos.waist.saveWaist(day, 5)).rejects.toBeInstanceOf(SqlFailure);
});

// MM-441: a weigh-in window lies within one day, in minutes after midnight; one stored backwards is refused when read.
it('the schema keeps a weigh-in window within one day', async () => {
  const { sql, repos } = await opened();
  await repos.weighInWindow.saveWeighInWindow(new WeighInWindow({ startMinute: 0, endMinute: 24 * 60 }));
  expect((await first(repos.weighInWindow.watchWeighInWindow())).endMinute).toBe(24 * 60);
  await expect(sql.execute('UPDATE user_preferences SET weigh_in_window_start_minute = 1440')).rejects.toBeInstanceOf(SqlFailure);
  await expect(sql.execute('UPDATE user_preferences SET weigh_in_window_start_minute = -1')).rejects.toBeInstanceOf(SqlFailure);
  await expect(sql.execute('UPDATE user_preferences SET weigh_in_window_end_minute = 0')).rejects.toBeInstanceOf(SqlFailure);
  await expect(sql.execute('UPDATE user_preferences SET weigh_in_window_end_minute = 1441')).rejects.toBeInstanceOf(SqlFailure);
  await sql.execute('UPDATE user_preferences SET weigh_in_window_start_minute = 900, weigh_in_window_end_minute = 600');
  await expect(first(repos.weighInWindow.watchWeighInWindow())).rejects.toThrow();
});

// Added in the move.
it('a stored value that is not one of its kind is refused when read, never defaulted', async () => {
  const { sql, repos } = await opened();
  await repos.setup.saveSetup(typicalSetup());
  await sql.execute("UPDATE setups SET goal_mode = 'bulk'");
  await expect(repos.setup.loadSetup()).rejects.toThrow('No such value: bulk');
});

it('saving a weigh-in again keeps the device the first reading came from', async () => {
  const { sql, repos } = await opened();
  await sql.execute('INSERT INTO weight_entries (epoch_day, weight_kg, device_id) VALUES (?, ?, ?)', [
    day.epochDay,
    80,
    'scale-1',
  ]);
  await repos.weights.saveWeight(day, 79.5);
  expect(await first(repos.weights.watchWeights())).toEqual([{ date: day, weightKg: 79.5, deviceId: 'scale-1' }]);
});

it('a database that is already open at this version is not created again', async () => {
  const { sql, repos } = await opened();
  await repos.weights.saveWeight(day, 80);
  await AppDatabase.open(sql);
  expect((await sql.select('SELECT count(*) AS n FROM weight_entries'))[0]?.['n']).toBe(1);
});
