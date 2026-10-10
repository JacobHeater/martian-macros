import 'package:mm_domain/mm_domain.dart';

import 'coach_snapshot.dart';
import 'compute_targets.dart';
import 'daily_targets.dart';
import 'target_inputs.dart';

/// What to show in place of targets during a pause (MM-148): maintenance,
/// whatever the goal, as a guide. It is never stored and nothing is judged
/// against it. A lean-gain surplus is suspended with everything else.
DailyTargets pausedGuide({
  required UserSetup setup,
  required CoachSnapshot snapshot,
}) => computeTargets(
  TargetInputs(
    sex: setup.profile.sex,
    heightCm: setup.profile.heightCm,
    trendWeightKg: snapshot.trendWeightKg,
    bodyFat: snapshot.bodyFat,
    mode: GoalMode.maintenance,
    trainingStatus: setup.trainingStatus,
    trainingDaysPerWeek: setup.trainingDaysPerWeek,
    policy: snapshot.policy,
    tdeeKcal: snapshot.tdee.kcal,
    bmrKcal: snapshot.bmrKcal,
  ),
);
