import 'stall_diagnosis.dart';
import 'stall_not_assessed_reason.dart';
import 'stall_status.dart';

/// The outcome of the stall diagnosis with the figures it rests on (MM-140),
/// so the user can be shown the same account the coach used.
final class StallAssessment {
  const StallAssessment({
    required this.status,
    required this.windowDays,
    this.notAssessedReason,
    this.diagnosis,
    this.gaining = false,
    this.usableFoodDays = 0,
    this.weighIns = 0,
    this.slopeKgPerWeek,
    this.intendedKgPerWeek,
    this.averageIntakeKcal,
    this.averageTargetKcal,
    this.waistChangeCm,
    this.maskedByEvent = false,
    this.expectedChangeKcal,
    this.atFloor = false,
    this.estimateLow = false,
  });

  const StallAssessment.notAssessed(
    StallNotAssessedReason reason, {
    required int windowDays,
  }) : this(
         status: StallStatus.notAssessed,
         windowDays: windowDays,
         notAssessedReason: reason,
       );

  final StallStatus status;
  final int windowDays;
  final StallNotAssessedReason? notAssessedReason;
  final StallDiagnosis? diagnosis;

  /// The goal is to gain, so the mirror wording applies.
  final bool gaining;

  final int usableFoodDays;
  final int weighIns;
  final double? slopeKgPerWeek;
  final double? intendedKgPerWeek;

  /// The window's average intake on whole days and average target: the same
  /// figures the adherence summary gives for the period.
  final double? averageIntakeKcal;
  final double? averageTargetKcal;

  /// Change in waist over the window (negative is down), when measured.
  final double? waistChangeCm;

  /// A passing weight event falls in the last days of the window.
  final bool maskedByEvent;

  /// The change to the calorie target expected at the next check-in under
  /// the estimate diagnosis (negative is a reduction); null when none.
  final double? expectedChangeKcal;

  /// The target is already at the calorie floor, so it cannot come down.
  final bool atFloor;

  /// The estimate is low enough that food is often missing from the log.
  final bool estimateLow;
}
