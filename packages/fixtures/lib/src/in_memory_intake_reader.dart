import 'package:mm_domain/mm_domain.dart';

import 'in_memory_day_mark_repository.dart';
import 'in_memory_food_repository.dart';

/// [IntakeReader] derived from an in-memory food log and day marks.
final class InMemoryIntakeReader implements IntakeReader {
  InMemoryIntakeReader(this._food, this._marks);

  final InMemoryFoodRepository _food;
  final InMemoryDayMarkRepository _marks;

  @override
  Stream<List<IntakeDay>> watchIntakeDays({required CalendarDate since}) =>
      combineLatest(
        _food.watchAll(),
        _marks.watchAll(),
        (food, marks) => intakeDaysFrom([
          for (final e in food)
            if (!e.date.isBefore(since)) e,
        ], marks),
      );
}
