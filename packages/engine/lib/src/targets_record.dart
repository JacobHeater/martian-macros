import 'package:mm_domain/mm_domain.dart';

import 'daily_targets.dart';
import 'target_rules_version.dart';
import 'targets_explanation.dart';
import 'tdee_status.dart';

/// Targets in force from [effectiveFrom], with the TDEE they were based on.
final class TargetsRecord {
  const TargetsRecord({
    required this.effectiveFrom,
    required this.targets,
    required this.mode,
    required this.tdeeKcal,
    required this.tdeeSigmaKcal,
    required this.tdeeStatus,
    this.safetyBodyFatPercent,
    this.profileRevision = 0,
    this.targetRulesVersion = currentTargetRulesVersion,
    this.explanation,
    this.summarySeen = true,
  });

  final CalendarDate effectiveFrom;
  final DailyTargets targets;
  final GoalMode mode;
  final double tdeeKcal;
  final double tdeeSigmaKcal;
  final TdeeStatus tdeeStatus;

  /// The body-fat figure the safety thresholds were applied to when these
  /// targets were made (`safetyBodyFatPercent`). The next check-in starts
  /// from it, so a rule does not flip on a small move. Null on records made
  /// before MM-132.
  final double? safetyBodyFatPercent;

  /// The `UserSetup.profileRevision` these targets were made for. A setup
  /// with a different revision (sex, date of birth, height or health check
  /// corrected, MM-83) gets new targets at once.
  final int profileRevision;

  /// The target-calculation rules used to issue these targets.
  final int targetRulesVersion;

  /// Why these targets were issued (MM-138). Null on records made before
  /// explanations were kept.
  final TargetsExplanation? explanation;

  /// Whether the target-change summary has been shown on app open. New engine
  /// check-ins mark their records unread; existing/imported records default
  /// to seen so they do not produce a backlog of dialogs.
  final bool summarySeen;

  TargetsRecord copyWith({bool? summarySeen}) => TargetsRecord(
    effectiveFrom: effectiveFrom,
    targets: targets,
    mode: mode,
    tdeeKcal: tdeeKcal,
    tdeeSigmaKcal: tdeeSigmaKcal,
    tdeeStatus: tdeeStatus,
    safetyBodyFatPercent: safetyBodyFatPercent,
    profileRevision: profileRevision,
    targetRulesVersion: targetRulesVersion,
    explanation: explanation,
    summarySeen: summarySeen ?? this.summarySeen,
  );
}
