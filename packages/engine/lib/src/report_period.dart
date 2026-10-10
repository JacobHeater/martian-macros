import 'package:mm_domain/mm_domain.dart';

/// One monthly report's span of days (MM-33): 28 days from the day coaching
/// started, then 28 more, and so on.
final class ReportPeriod {
  const ReportPeriod({required this.index, required this.from});

  /// Zero for the first report.
  final int index;

  /// The first day covered.
  final CalendarDate from;

  static const days = 28;

  /// The last day covered.
  CalendarDate get to => from.addDays(days - 1);

  /// The first day a report on this period can be read: the day after it.
  CalendarDate get readyOn => to.addDays(1);
}
