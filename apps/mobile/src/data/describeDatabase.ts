import type { BackupContents } from '../domain/backup/BackupContents';
import { CalendarDate } from '../domain/CalendarDate';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlValue } from '../sql/SqlValue';

const count = async (db: SqlDatabase, sql: string): Promise<number> => Number((await db.select(sql))[0]?.['n'] ?? 0);
const day = (value: SqlValue | undefined): CalendarDate | undefined =>
  typeof value === 'number' ? CalendarDate.fromEpochDay(value) : undefined;

/** What a database at the current schema holds, as a backup's contents are said (MM-63). */
export async function describeDatabase(db: SqlDatabase): Promise<BackupContents> {
  const span = (
    await db.select('SELECT min(d) AS first, max(d) AS last FROM (SELECT epoch_day AS d FROM weight_entries UNION ALL SELECT epoch_day FROM food_entries)')
  )[0];
  return {
    weighIns: await count(db, 'SELECT count(*) AS n FROM weight_entries'),
    foodDays: await count(db, 'SELECT count(DISTINCT epoch_day) AS n FROM food_entries'),
    workouts: await count(db, 'SELECT count(*) AS n FROM workouts'),
    customFoods: await count(db, 'SELECT count(*) AS n FROM custom_foods'),
    from: day(span?.['first']),
    to: day(span?.['last']),
    hasSetup: (await count(db, 'SELECT count(*) AS n FROM setups')) > 0,
  };
}
