import 'package:mm_domain/mm_domain.dart';

/// What the under-eating rule saw (MM-114): the average of the days that
/// count as whole, against the lowest the app would ever suggest.
final class UnderEatingFinding {
  const UnderEatingFinding({
    required this.averageKcal,
    required this.floorKcal,
    required this.days,
    required this.lowDays,
  });

  final double averageKcal;
  final double floorKcal;

  /// How many whole days the average rests on.
  final int days;

  /// The whole days below the floor: the ones to mark partial if they are
  /// missing food.
  final List<CalendarDate> lowDays;
}
