import { ReminderKind } from '../domain/ReminderKind';
import { ReminderSetting } from '../domain/ReminderSetting';
import type { ReminderRepository } from '../domain/repositories/ReminderRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { asFlag, flag, integer, named, optionalDay, orNull } from './columns';
import { upsert } from './upsert';

/** `ReminderRepository` kept in the database. */
export class SqlReminderRepository implements ReminderRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchReminders(): Watched<ReminderSetting[]> {
    return this.db.watch(['reminders'], async (db) =>
      (await db.select('SELECT * FROM reminders'))
        .map(
          (row) =>
            new ReminderSetting({
              kind: named(ReminderKind.values, row, 'kind'),
              enabled: flag(row, 'enabled'),
              minuteOfDay: integer(row, 'minute_of_day'),
              countFrom: optionalDay(row, 'count_from_epoch_day'),
            }),
        )
        .sort((a, b) => ReminderKind.values.indexOf(a.kind) - ReminderKind.values.indexOf(b.kind)),
    );
  }

  saveReminder(setting: ReminderSetting): Promise<void> {
    return this.db.write(['reminders'], (db) =>
      upsert(db, 'reminders', ['kind'], {
        kind: setting.kind,
        enabled: asFlag(setting.enabled),
        minute_of_day: setting.minuteOfDay,
        count_from_epoch_day: orNull(setting.countFrom?.epochDay),
      }),
    );
  }
}
