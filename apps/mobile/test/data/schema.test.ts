import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrient } from '../../src/domain/food/micros/Micronutrient';
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
  // Version 7 (MM-364): the switches of Settings > Coach.
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
  ],
  // Version 6 (MM-359): a clinician's limit on what the person drinks.
  setups: ['fluid_limited_by_clinician'],
  // Version 4 (MM-308): the micronutrients a food log entry keeps.
  food_entries: Micronutrient.added.map((n) => Micronutrient.column(n)),
  // Version 4 (MM-309): fiber, sodium and the micronutrients of a food of one's own.
  custom_foods: ['fiber_g', ...Micronutrient.values.map((n) => Micronutrient.column(n))],
};

/** The tables added since the Dart database's last version. */
const tablesAddedSince: readonly string[] = [
  // Version 4 (MM-313): the water log.
  'water_entries',
  // Version 7 (MM-363): the inline insights shown.
  'inline_insight_log',
  // Version 8 (MM-378): the inline insights snoozed.
  'inline_insight_snoozes',
];

// MM-231: `dartSchemaV31.json` is every column of every table as the Dart
// app's database declared it at its last version, written by that database
// on 2026-10-12. Anything since is named in `addedSince`, and nothing else.
it('every table has the columns the Dart database had, in the same order, of the same kind, then what was added', async () => {
  const { sql } = await opened();
  expect([...tables].sort()).toEqual([...Object.keys(dartTables), ...tablesAddedSince].sort());
  for (const [table, columns] of Object.entries(dartTables)) {
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
