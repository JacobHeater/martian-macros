import 'package:mm_domain/mm_domain.dart';

import 'adherence_summary.dart';
import 'intake_standing_of.dart';
import 'targets_record.dart';
import 'usable_intake_days.dart';

/// The adherence summary for the [days] days ending on [through] (MM-149).
///
/// Which days count as whole is decided by the same rule the expenditure
/// estimate uses, judged over the four weeks ending on [through] so one thin
/// week cannot set its own standard. [floorKcal] is the lowest target the app
/// would suggest; an average below it is never "on target".
AdherenceSummary summarizeAdherence({
  required CalendarDate through,
  required List<IntakeDay> intake,
  required List<WeightObservation> weights,
  required List<TargetsRecord> history,
  double? floorKcal,
  int days = 7,
}) {
  final from = through.addDays(1 - days);
  bool inWeek(CalendarDate d) => !d.isBefore(from) && !d.isAfter(through);

  final contextFrom = through.addDays(-27);
  final context = [
    for (final d in intake)
      if (!d.date.isBefore(contextFrom) && !d.date.isAfter(through)) d,
  ];
  final complete = [
    for (final d in usableIntakeDays(context))
      if (inWeek(d.date)) d,
  ];
  final logged = intake.where((d) => inWeek(d.date) && d.kcal > 0).length;

  final sorted = [...history]
    ..sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  TargetsRecord? inForceOn(CalendarDate day) {
    TargetsRecord? found;
    for (final r in sorted) {
      if (r.effectiveFrom.isAfter(day)) break;
      found = r;
    }
    return found;
  }

  var targetSum = 0.0, targetDays = 0;
  for (var i = 0; i < days; i++) {
    final record = inForceOn(from.addDays(i));
    if (record != null) {
      targetSum += record.targets.kcal;
      targetDays++;
    }
  }
  final averageTarget = targetDays == 0 ? null : targetSum / targetDays;

  double? averageIntake;
  var mostlyEstimated = false;
  int? proteinDays;
  if (complete.isNotEmpty) {
    final kcal = complete.fold(0.0, (s, d) => s + d.kcal);
    averageIntake = kcal / complete.length;
    final estimated = complete.fold(
      0.0,
      (s, d) => s + d.kcal * d.estimatedShare,
    );
    mostlyEstimated = kcal > 0 && estimated / kcal > 0.5;
  }
  for (final d in complete) {
    final minimum = inForceOn(d.date)?.targets.proteinMinimumG;
    if (minimum == null) continue;
    proteinDays = (proteinDays ?? 0) + (d.proteinG >= minimum ? 1 : 0);
  }

  return AdherenceSummary(
    from: from,
    to: through,
    daysLogged: logged,
    completeDays: complete.length,
    weighIns: weights.where((w) => inWeek(w.date)).length,
    averageIntakeKcal: averageIntake,
    averageTargetKcal: averageTarget,
    standing: averageIntake == null || averageTarget == null
        ? null
        : intakeStandingOf(
            kcal: averageIntake,
            targetKcal: averageTarget,
            floorKcal: floorKcal,
          ),
    proteinDays: proteinDays,
    mostlyEstimated: mostlyEstimated,
  );
}
