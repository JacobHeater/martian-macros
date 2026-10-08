import 'package:mm_domain/mm_domain.dart';

import 'activity_factor.dart';
import 'tdee_prior.dart';

/// Starting TDEE before any adaptive data: resting energy times the activity
/// factor for the user's daily activity and training days, with a wide (15%)
/// uncertainty that the estimator quickly overrides.
TdeePrior initialTdeePrior({
  required double bmrKcal,
  required DailyActivity dailyActivity,
  required int trainingDaysPerWeek,
}) {
  final kcal =
      bmrKcal *
      activityFactor(
        dailyActivity: dailyActivity,
        trainingDaysPerWeek: trainingDaysPerWeek,
      );
  return TdeePrior(kcal: kcal, sigmaKcal: kcal * 0.15);
}
