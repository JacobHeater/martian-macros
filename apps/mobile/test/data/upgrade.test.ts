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

// MM-242: the first real step. A database as version 1 left it gains the two
// columns for the agreement to the terms, and keeps what it held.
it('a version 1 database comes up to date: nothing lost, and nobody has agreed to the terms yet', async () => {
  const versionOne = currentSchema
    .replace('  "terms_accepted_version" INTEGER NULL,\n', '')
    .replace('  "terms_accepted_epoch_day" INTEGER NULL,\n', '');
  expect(versionOne).not.toContain('terms_accepted');
  const old = await openSql();
  await AppDatabase.open(old, { version: 1, schema: versionOne });
  await old.execute("INSERT INTO user_preferences (id, theme_preference) VALUES (1, 'dark')");
  expect(await columnsOf(old, 'user_preferences')).not.toContain('terms_accepted_version');

  const sql = await openSql({ bytes: await old.exportBytes() });
  const repos = await SqlRepositories.open(sql);
  expect(await versionOf(sql)).toBe(current);
  expect(await columnsOf(sql, 'user_preferences')).toEqual(
    expect.arrayContaining(['terms_accepted_version', 'terms_accepted_epoch_day']),
  );
  expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
  expect(await first(repos.preferences.watchTermsAcceptance())).toBeUndefined();
});
