import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

/// The day shown on the Today tab; null follows the real current day.
class SelectedDay extends Notifier<CalendarDate?> {
  @override
  CalendarDate? build() => null;

  void set(CalendarDate? day) => state = day;
}
