import 'package:mm_domain/mm_domain.dart';

import 'pause_on.dart';

/// [intake] without the days inside a pause (MM-148): eating on holiday is
/// not the eating the coach is trying to measure.
///
/// With [keepComplete], a paused day the user logged and marked complete
/// stays, which is what the expenditure estimate wants: careful logging
/// through a business trip is good data. Anything that judges a day against
/// a target passes false, because nothing on a paused day is judged.
List<IntakeDay> withoutPausedDays(
  List<IntakeDay> intake,
  Iterable<Pause> pauses, {
  required bool keepComplete,
}) {
  final all = pauses.toList();
  if (all.isEmpty) return intake;
  return [
    for (final day in intake)
      if (pauseOn(all, day.date) == null ||
          (keepComplete && day.completeness == DayCompleteness.complete))
        day,
  ];
}
