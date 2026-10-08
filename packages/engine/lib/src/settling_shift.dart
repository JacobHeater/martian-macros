import 'package:mm_domain/mm_domain.dart';

import 'coach_constants.dart';
import 'settling_window.dart';
import 'trend_shift.dart';

/// For the trend filter: the extra movement allowed on each day of a
/// settling window.
TrendShift? Function(CalendarDate) settlingShift(
  List<SettlingWindow> windows,
  double weightKg,
) {
  final shift = TrendShift(
    levelSigmaKg: settlingShiftFraction * weightKg,
    slopeSigmaKgPerDay: settlingSlopeShiftFraction * weightKg,
  );
  return (date) => windows.any((w) => w.contains(date)) ? shift : null;
}
