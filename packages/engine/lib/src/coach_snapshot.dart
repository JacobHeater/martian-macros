import 'package:mm_domain/mm_domain.dart';

import 'body_fat_estimate.dart';
import 'coach_confidence.dart';
import 'mode_recommendation.dart';
import 'tdee_estimate.dart';
import 'weight_event_effects.dart';
import 'weight_trend_point.dart';

/// Everything the engine currently believes about the user.
final class CoachSnapshot {
  const CoachSnapshot({
    required this.policy,
    required this.trend,
    required this.trendWeightKg,
    required this.bodyFat,
    required this.bmrKcal,
    required this.calorieFloorKcal,
    required this.tdee,
    required this.confidence,
    required this.recommendation,
    this.lastCreatineEventOn,
  });

  final CoachingPolicy policy;

  /// One point per day from the first weigh-in; empty before any weigh-in.
  final List<WeightTrendPoint> trend;
  final double trendWeightKg;
  final BodyFatEstimate bodyFat;
  final double bmrKcal;

  /// The lowest calorie target the app would ever suggest for this person
  /// (`SafetyBounds.calorieFloorKcal`). Intake is described against it
  /// (MM-114, MM-149).
  final double calorieFloorKcal;
  final TdeeEstimate tdee;
  final CoachConfidence confidence;
  final ModeRecommendation recommendation;
  final CalendarDate? lastCreatineEventOn;

  bool creatineReductionPausedOn(CalendarDate today) {
    final event = lastCreatineEventOn;
    return event != null &&
        !event.isAfter(today) &&
        event.daysUntil(today) <= weightEventReductionPauseDays;
  }
}
