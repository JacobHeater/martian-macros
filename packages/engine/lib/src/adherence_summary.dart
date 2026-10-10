import 'package:mm_domain/mm_domain.dart';

import 'intake_standing.dart';

/// What the user did over a week, as separate facts (MM-149). There is no
/// score, percentage or grade combining them: a composite hides which thing
/// is wrong, and one that rises with closeness to target rewards under-eating.
///
/// The coach's own rules read the same figures the user is shown.
final class AdherenceSummary {
  const AdherenceSummary({
    required this.from,
    required this.to,
    required this.daysLogged,
    required this.completeDays,
    required this.weighIns,
    required this.mostlyEstimated,
    this.averageIntakeKcal,
    this.averageTargetKcal,
    this.standing,
    this.proteinDays,
    this.workouts,
  });

  final CalendarDate from;
  final CalendarDate to;

  /// Days with any food logged.
  final int daysLogged;

  /// Of those, the days that count as whole days: marked complete, or
  /// unmarked and passing the usable-day rule (MM-27). Partial and unlogged
  /// days are not counted against anything.
  final int completeDays;
  final int weighIns;

  /// Mean intake on the complete days; null with none.
  final double? averageIntakeKcal;

  /// Mean calorie target over the days of the week that had one; null when
  /// no targets were in force.
  final double? averageTargetKcal;

  /// Where the average intake sits against the average target; null when
  /// either is missing.
  final IntakeStanding? standing;

  /// Complete days at or above the protein minimum (MM-121); null when no
  /// minimum was in force.
  final int? proteinDays;

  /// More than half the complete days' calories came from estimated entries
  /// (MM-150), which limits what the average can be trusted for.
  final bool mostlyEstimated;

  /// Null until the training log exists.
  final int? workouts;

  /// Intake less target, signed; null when either is missing.
  double? get distanceKcal {
    final intake = averageIntakeKcal;
    final target = averageTargetKcal;
    return intake == null || target == null ? null : intake - target;
  }
}
