import 'package:mm_domain/mm_domain.dart';

/// A run of days with no weigh-in and no food logged (MM-147).
final class ActivityGap {
  const ActivityGap({required this.from, required this.to});

  /// The first and last day with nothing recorded.
  final CalendarDate from;
  final CalendarDate to;

  int get days => from.daysUntil(to) + 1;

  /// The first day back.
  CalendarDate get returnOn => to.addDays(1);
}
