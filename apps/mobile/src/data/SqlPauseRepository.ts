import { Pause } from '../domain/Pause';
import { PauseReason } from '../domain/PauseReason';
import type { PauseRepository } from '../domain/repositories/PauseRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { asFlag, day, flag, named } from './columns';
import { upsert } from './statements';

/** `PauseRepository` kept in the database. */
export class SqlPauseRepository implements PauseRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchPauses(): Watched<Pause[]> {
    return this.db.watch(['pauses'], async (db) =>
      (await db.select('SELECT * FROM pauses ORDER BY from_epoch_day')).map(
        (row) =>
          new Pause({
            from: day(row, 'from_epoch_day'),
            to: day(row, 'to_epoch_day'),
            reason: named(PauseReason.values, row, 'reason'),
            extended: flag(row, 'extended'),
          }),
      ),
    );
  }

  savePause(pause: Pause): Promise<void> {
    return this.db.write(['pauses'], (db) =>
      upsert(db, 'pauses', ['from_epoch_day'], {
        from_epoch_day: pause.from.epochDay,
        to_epoch_day: pause.to.epochDay,
        reason: pause.reason,
        extended: asFlag(pause.extended),
      }),
    );
  }

  deletePause(pause: Pause): Promise<void> {
    return this.db.write(['pauses'], (db) =>
      db.execute('DELETE FROM pauses WHERE from_epoch_day = ?', [pause.from.epochDay]),
    );
  }
}
