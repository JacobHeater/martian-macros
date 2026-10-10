import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [ReminderRepository] over the Drift database.
final class DriftReminderRepository implements ReminderRepository {
  DriftReminderRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<ReminderSetting>> watchReminders() => _db
      .select(_db.reminders)
      .watch()
      .map(
        (rows) => [
          for (final row in rows)
            ReminderSetting(
              kind: row.kind,
              enabled: row.enabled,
              minuteOfDay: row.minuteOfDay,
              countFrom: row.countFromEpochDay == null
                  ? null
                  : CalendarDate.fromEpochDay(row.countFromEpochDay!),
            ),
        ]..sort((a, b) => a.kind.index.compareTo(b.kind.index)),
      );

  @override
  Future<void> saveReminder(ReminderSetting setting) => _db
      .into(_db.reminders)
      .insertOnConflictUpdate(
        RemindersCompanion.insert(
          kind: setting.kind,
          enabled: setting.enabled,
          minuteOfDay: setting.minuteOfDay,
          countFromEpochDay: Value(setting.countFrom?.epochDay),
        ),
      );
}
