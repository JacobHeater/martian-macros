import 'package:mm_domain/mm_domain.dart';

/// Days on which the scale moves for reasons that are not tissue: the
/// first days after energy intake changes level, when glycogen, the water
/// stored with it, and gut contents shift by a kilogram or two. The
/// estimator ignores weight change and intake inside the window.
final class SettlingWindow {
  const SettlingWindow(this.start, this.end);

  /// The first day at the new intake.
  final CalendarDate start;

  /// The last day left out, inclusive.
  final CalendarDate end;

  bool contains(CalendarDate day) => !day.isBefore(start) && !day.isAfter(end);
}
