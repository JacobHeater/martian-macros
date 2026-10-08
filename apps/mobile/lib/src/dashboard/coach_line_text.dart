import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../providers.dart';

/// The one line the dashboard says about what the coach is doing.
String coachLineText({
  required UserSetup setup,
  required List<TargetsRecord> history,
  required CalendarDate today,
}) {
  final day = setup.onboardedOn.daysUntil(today) + 1;
  if (day <= calibrationDays) {
    return 'Calibration, day $day of $calibrationDays. Targets hold while '
        'the app learns your metabolism.';
  }
  if (history.isEmpty) return 'Targets arrive with your first weigh-in.';
  final current = history.last;
  if (history.length >= 2 && current.effectiveFrom.daysUntil(today) <= 7) {
    final change =
        current.targets.kcal - history[history.length - 2].targets.kcal;
    if (change.round() != 0) {
      return 'Targets went ${change < 0 ? 'down' : 'up'} '
          '${change.abs().round()} kcal on '
          '${Fmt.day(current.effectiveFrom, today)}.';
    }
  }
  return 'Next check-in ${Fmt.day(nextCheckIn(setup, current), today)}.';
}
