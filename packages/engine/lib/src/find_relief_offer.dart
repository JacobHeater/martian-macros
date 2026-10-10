import 'package:mm_domain/mm_domain.dart';

import 'consecutive_deficit_weeks.dart';
import 'pause_on.dart';
import 'relief_choice.dart';
import 'relief_offer.dart';
import 'relief_rule.dart';
import 'slower_pace.dart';
import 'targets_record.dart';

/// The offer to ease a deficit, if one is due on [today] (MM-117).
///
/// Made only on a deficit goal whose current targets are a deficit, when
/// each of the last two weekly check-ins (MM-116) had at least three of its
/// five answers at the hard end. Not during a pause, and not for three weeks
/// after the user last answered it.
///
/// The strength trigger of MM-117 needs the training log and is not here.
/// Nothing this returns can lower calories or ask for more exercise: the
/// choices are a maintenance week, a slower pace, or carrying on.
ReliefOffer? findReliefOffer({
  required UserSetup setup,
  required List<RecoveryCheckIn> checkIns,
  required List<TargetsRecord> history,
  required CalendarDate today,
  CalendarDate? deficitRestartOn,
  Iterable<Pause> pauses = const [],
}) {
  if (setup.goalMode != GoalMode.fatLoss && setup.goalMode != GoalMode.recomp) {
    return null;
  }
  if (history.isEmpty || history.last.targets.weeklyRateFraction >= 0) {
    return null;
  }
  if (pauseOn(pauses, today) != null) return null;
  final answered = setup.reliefAnsweredOn;
  if (answered != null &&
      !answered.isAfter(today) &&
      answered.daysUntil(today) < ReliefRule.quietDays) {
    return null;
  }

  final sorted = [
    for (final c in checkIns)
      if (!c.date.isAfter(today)) c,
  ]..sort((a, b) => a.date.compareTo(b.date));
  if (sorted.length < ReliefRule.hardCheckInsRunning) return null;
  final recent = sorted.sublist(sorted.length - ReliefRule.hardCheckInsRunning);
  if (recent.last.date.daysUntil(today) >= ReliefRule.freshDays) return null;
  for (var i = 1; i < recent.length; i++) {
    final apart = recent[i - 1].date.daysUntil(recent[i].date);
    if (apart > ReliefRule.consecutiveWithinDays ||
        apart < ReliefRule.apartDays) {
      return null;
    }
  }
  if (!recent.every(_hard)) return null;

  final weeks = consecutiveDeficitWeeks(
    history,
    today,
    restartOn: deficitRestartOn,
  );
  final slower = setup.goalMode == GoalMode.fatLoss
      ? slowerPace(setup.requestedLossFraction)
      : null;
  final hours = [
    for (final c in recent)
      if (c.sleepHours != null) c.sleepHours!,
  ];
  return ReliefOffer(
    suggestion: slower == null || weeks >= ReliefRule.breakFromDeficitWeeks
        ? ReliefChoice.maintenanceWeek
        : ReliefChoice.slowerPace,
    slowerPace: slower,
    deficitWeeks: weeks,
    shortSleep:
        hours.isNotEmpty &&
        hours.reduce((a, b) => a + b) / hours.length <
            ReliefRule.shortSleepHours,
  );
}

bool _hard(RecoveryCheckIn checkIn) =>
    RecoveryQuestion.values
        .where((q) => checkIn.answer(q) <= ReliefRule.hardAnswer)
        .length >=
    ReliefRule.hardAnswersPerCheckIn;
