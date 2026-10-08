import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [DayMarkRepository] held in memory.
final class InMemoryDayMarkRepository implements DayMarkRepository {
  final _marks = ObservableValue<Map<int, DayCompleteness>>({});

  /// Every mark keyed by epoch day, for implementations that derive from
  /// the marks (see [InMemoryIntakeReader]).
  Stream<Map<int, DayCompleteness>> watchAll() => _marks.watch();

  @override
  Stream<DayCompleteness> watchCompleteness(CalendarDate date) => _marks
      .watch()
      .map((marks) => marks[date.epochDay] ?? DayCompleteness.unmarked);

  @override
  Future<void> setCompleteness(
    CalendarDate date,
    DayCompleteness completeness,
  ) async {
    _marks.value = {..._marks.value, date.epochDay: completeness};
  }

  void clear() => _marks.value = {};
}
