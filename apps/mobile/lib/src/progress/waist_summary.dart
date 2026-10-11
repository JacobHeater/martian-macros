import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/waist_amount.dart';

/// The waist card's line (MM-155): the latest measurement and whether it
/// has changed since the start, by the one rule every feature uses. The
/// start is the middle of the first three entries, not one reading, and a
/// difference inside the tape's noise is said to be no clear change.
/// "Latest: 91 cm on Oct 5. Down 2.5 cm since you started."
String waistSummary(List<WaistObservation> waist, Fmt fmt, CalendarDate today) {
  final latest = waist.last;
  final base =
      'Latest: ${waistAmount(latest.waistCm, fmt)} on '
      '${Fmt.shortDay(latest.date)}.';
  if (waist.length < 2) return base;
  final change = waistChangeOf(waist: waist, asOf: today, sinceStart: true);
  if (change == null) return '$base Measure again to see how it has changed.';
  final amount = waistAmount(change.changeCm, fmt);
  return switch (change.direction) {
    MeasuredChange.down => '$base Down $amount since you started.',
    MeasuredChange.up => '$base Up $amount since you started.',
    MeasuredChange.noClearChange =>
      '$base No clear change since you started: a difference under '
          '${waistAmount(change.thresholdCm, fmt)} is within what a tape '
          'can tell.',
  };
}
