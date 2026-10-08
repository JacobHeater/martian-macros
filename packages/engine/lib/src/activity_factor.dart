import 'package:mm_domain/mm_domain.dart';

/// The multiplier on resting energy for the starting expenditure estimate:
/// a factor for the day outside workouts, plus a step per weekly training day.
///
/// This is a documented heuristic for the first days only; the estimator
/// replaces it with a measurement from logs and weigh-ins (MM-24). The table
/// and its reasoning are in requirements MM-164, and it is the first thing
/// the professional reviewer (MM-29) should see.
double activityFactor({
  required DailyActivity dailyActivity,
  required int trainingDaysPerWeek,
}) {
  final daily = switch (dailyActivity) {
    DailyActivity.seated => 1.20,
    DailyActivity.light => 1.30,
    DailyActivity.onFeet => 1.40,
    DailyActivity.physicalJob => 1.50,
  };
  return daily + 0.025 * trainingDaysPerWeek.clamp(0, 7);
}
