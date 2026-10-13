import { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import type { RecoveryCheckInRepository } from '../domain/repositories/RecoveryCheckInRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, integer, optionalNumber, orNull } from './columns';
import { upsert } from './upsert';

/** `RecoveryCheckInRepository` kept in the database. */
export class SqlRecoveryCheckInRepository implements RecoveryCheckInRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchRecoveryCheckIns(): Watched<RecoveryCheckIn[]> {
    return this.db.watch(['recovery_check_ins'], async (db) =>
      (await db.select('SELECT * FROM recovery_check_ins ORDER BY date_epoch_day')).map(
        (row) =>
          new RecoveryCheckIn({
            date: day(row, 'date_epoch_day'),
            hunger: integer(row, 'hunger'),
            energy: integer(row, 'energy'),
            sleep: integer(row, 'sleep'),
            training: integer(row, 'training'),
            mood: integer(row, 'mood'),
            sleepHours: optionalNumber(row, 'sleep_hours'),
          }),
      ),
    );
  }

  saveRecoveryCheckIn(checkIn: RecoveryCheckIn): Promise<void> {
    return this.db.write(['recovery_check_ins'], (db) =>
      upsert(db, 'recovery_check_ins', ['date_epoch_day'], {
        date_epoch_day: checkIn.date.epochDay,
        hunger: checkIn.hunger,
        energy: checkIn.energy,
        sleep: checkIn.sleep,
        training: checkIn.training,
        mood: checkIn.mood,
        sleep_hours: orNull(checkIn.sleepHours),
      }),
    );
  }
}
