import type { HealthBackfillMarks } from '../healthIngest/HealthBackfillMarks';
import { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthSample } from '../healthIngest/HealthSample';
import type { HealthSampleStore } from '../healthIngest/HealthSampleStore';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlValue } from '../sql/SqlValue';
import type { AppDatabase } from './AppDatabase';
import { moment, named, number, optionalMoment, orNull, text } from './columns';
import { placeholders } from './placeholders';
import { upsert } from './upsert';

/** How many ids go into one statement: well under what SQLite allows. */
const idsPerStatement = 500;

/** The columns of a sample's row, in the order its values are bound. */
const sampleColumns = ['type', 'platform_id', 'value', 'start_ms', 'end_ms', 'source_id', 'source_name'] as const;

/**
 * How many samples go into one statement (MM-721): under 999 parameters, SQLite's limit before 3.32, which Android
 * 8's SQLite has. On a phone every statement is a round trip over the native bridge, and a re-read after a move or
 * an expired token brings tens of thousands of samples: one statement a row was twenty minutes on the owner's Pixel.
 */
const samplesPerStatement = Math.floor(999 / sampleColumns.length);

const sampleValues = (sample: HealthSample): SqlValue[] => [
  sample.type,
  sample.platformId,
  sample.value,
  sample.start.getTime(),
  orNull(sample.end?.getTime()),
  sample.sourceId,
  sample.sourceName,
];

/** Adds the samples, or changes those already there (by type and platform id), in multi-row statements. */
async function upsertAll(db: SqlDatabase, samples: readonly HealthSample[]): Promise<void> {
  const tuple = `(${placeholders(sampleColumns.length)})`;
  const changed = sampleColumns
    .filter((column) => column !== 'type' && column !== 'platform_id')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');
  for (let at = 0; at < samples.length; at += samplesPerStatement) {
    const batch = samples.slice(at, at + samplesPerStatement);
    await db.execute(
      `INSERT INTO imported_samples (${sampleColumns.join(', ')}) VALUES ${batch.map(() => tuple).join(', ')} ` +
        `ON CONFLICT (type, platform_id) DO UPDATE SET ${changed}`,
      batch.flatMap(sampleValues),
    );
  }
}

/**
 * The key a backfill mark is kept under (MM-73). Marks share the table of
 * import tokens, a text by a name, under names no type has, so no schema
 * change was needed; the mark is the moment in milliseconds.
 */
const markKey = (type: HealthDataType) => `backfill:${type}`;

/**
 * `HealthSampleStore` kept in the database, and the backfill's marks
 * (MM-73) beside its tokens.
 */
export class SqlHealthSampleStore implements HealthSampleStore, HealthBackfillMarks {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  samples(type: HealthDataType): Promise<HealthSample[]> {
    return this.db.read(async (db) =>
      (await db.select('SELECT * FROM imported_samples WHERE type = ? ORDER BY start_ms, platform_id', [type])).map(
        (row) => ({
          platformId: text(row, 'platform_id'),
          type: named(HealthDataType.values, row, 'type'),
          value: number(row, 'value'),
          start: moment(row, 'start_ms'),
          end: optionalMoment(row, 'end_ms'),
          sourceId: text(row, 'source_id'),
          sourceName: text(row, 'source_name'),
        }),
      ),
    );
  }

  upsert(samples: readonly HealthSample[]): Promise<void> {
    return this.db.write(['imported_samples'], (db) => upsertAll(db, samples));
  }

  delete(type: HealthDataType, platformIds: readonly string[]): Promise<void> {
    return this.db.write(['imported_samples'], async (db) => {
      for (let from = 0; from < platformIds.length; from += idsPerStatement) {
        const ids = platformIds.slice(from, from + idsPerStatement);
        await db.execute(
          `DELETE FROM imported_samples WHERE type = ? AND platform_id IN (${ids.map(() => '?').join(', ')})`,
          [type, ...ids],
        );
      }
    });
  }

  replace(type: HealthDataType, samples: readonly HealthSample[]): Promise<void> {
    return this.db.write(['imported_samples'], async (db) => {
      await db.execute('DELETE FROM imported_samples WHERE type = ?', [type]);
      await upsertAll(db, samples);
    });
  }

  token(type: HealthDataType): Promise<string | undefined> {
    return this.db.read(async (db) => {
      const row = (await db.select('SELECT token FROM health_import_tokens WHERE type = ?', [type]))[0];
      return row === undefined ? undefined : text(row, 'token');
    });
  }

  saveToken(type: HealthDataType, token: string): Promise<void> {
    return this.db.write(['health_import_tokens'], (db) =>
      upsert(db, 'health_import_tokens', ['type'], { type, token }),
    );
  }

  backfilledFrom(type: HealthDataType): Promise<Date | undefined> {
    return this.db.read(async (db) => {
      const row = (await db.select('SELECT token FROM health_import_tokens WHERE type = ?', [markKey(type)]))[0];
      if (row === undefined) return undefined;
      const ms = Number(text(row, 'token'));
      return Number.isFinite(ms) ? new Date(ms) : undefined;
    });
  }

  saveBackfilledFrom(type: HealthDataType, from: Date): Promise<void> {
    return this.db.write(['health_import_tokens'], (db) =>
      upsert(db, 'health_import_tokens', ['type'], { type: markKey(type), token: String(from.getTime()) }),
    );
  }
}
