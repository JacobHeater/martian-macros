import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// A synthetic weight trend for the safety checks: [days] points from
/// [start], losing [lossFractionPerWeek] of [levelKg] a week at a steady
/// pace, with the given uncertainty on the pace. A weigh-in is used on every
/// [observedEvery]th day.
List<WeightTrendPoint> trendOf({
  required CalendarDate start,
  int days = 21,
  double levelKg = 90,
  required double lossFractionPerWeek,
  double slopeSigmaFractionPerWeek = 0.0005,
  int observedEvery = 1,
}) {
  final slope = -lossFractionPerWeek * levelKg / 7;
  final sigmaPerDay = slopeSigmaFractionPerWeek * levelKg / 7;
  return [
    for (var i = 0; i < days; i++)
      WeightTrendPoint(
        date: start.addDays(i),
        levelKg: levelKg + slope * (i - (days - 1)),
        slopeKgPerDay: slope,
        waterKg: 0,
        levelVariance: 0.04,
        slopeVariance: sigmaPerDay * sigmaPerDay,
        observed: i % observedEvery == 0,
        rejected: false,
      ),
  ];
}

/// A targets record that starts a deficit on [day]: 500 kcal under
/// expenditure, which opens a settling window.
TargetsRecord deficitStartingOn(CalendarDate day) => TargetsRecord(
  effectiveFrom: day,
  mode: GoalMode.fatLoss,
  tdeeKcal: 2800,
  tdeeSigmaKcal: 300,
  tdeeStatus: TdeeStatus.held,
  targets: const DailyTargets(
    kcal: 2300,
    proteinG: 160,
    fatG: 70,
    carbsG: 250,
    weeklyRateFraction: -0.0075,
  ),
);
