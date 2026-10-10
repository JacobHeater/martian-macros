import 'package:mm_domain/mm_domain.dart';

/// How many whole days the user has logged in a row, with a missed day
/// forgiven now and then (MM-92).
final class LoggingStreak {
  const LoggingStreak({required this.days, this.forgivenOn});

  /// Whole days in the streak. A forgiven day is not counted and does not
  /// break it.
  final int days;

  /// The most recent day that was missed and forgiven; null with none.
  final CalendarDate? forgivenOn;
}
