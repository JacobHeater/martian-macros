import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'observable_value.dart';

/// [InsightLogRepository] held in memory.
final class InMemoryInsightLogRepository implements InsightLogRepository {
  final _entries = ObservableValue<List<InsightLogEntry>>(const []);

  @override
  Stream<List<InsightLogEntry>> watchInsightLog() => _entries.watch();

  @override
  Future<void> recordInsightShown(InsightRule rule, CalendarDate day) async {
    final all = [..._entries.value, InsightLogEntry(rule: rule, shownOn: day)];
    // Stable by day, so entries of one day keep the order they were added in.
    final indexed = [for (final (i, e) in all.indexed) (i, e)]
      ..sort((a, b) {
        final byDay = a.$2.shownOn.compareTo(b.$2.shownOn);
        return byDay != 0 ? byDay : a.$1.compareTo(b.$1);
      });
    _entries.value = [for (final (_, e) in indexed) e];
  }

  @override
  Future<void> dismissInsight(InsightRule rule, CalendarDate day) async {
    final index = _entries.value.lastIndexWhere((e) => e.rule == rule);
    if (index < 0) return;
    final entry = _entries.value[index];
    _entries.value = [
      ..._entries.value.sublist(0, index),
      InsightLogEntry(rule: rule, shownOn: entry.shownOn, dismissedOn: day),
      ..._entries.value.sublist(index + 1),
    ];
  }

  void clear() => _entries.value = const [];
}
