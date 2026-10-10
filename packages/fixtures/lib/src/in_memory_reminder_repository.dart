import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [ReminderRepository] held in memory.
final class InMemoryReminderRepository implements ReminderRepository {
  final _settings = ObservableValue<List<ReminderSetting>>(const []);

  @override
  Stream<List<ReminderSetting>> watchReminders() => _settings.watch();

  @override
  Future<void> saveReminder(ReminderSetting setting) async {
    _settings.value = [
      for (final existing in _settings.value)
        if (existing.kind != setting.kind) existing,
      setting,
    ]..sort((a, b) => a.kind.index.compareTo(b.kind.index));
  }

  /// Empties the store (used by [InMemoryDataEraser]).
  void clear() => _settings.value = const [];
}
