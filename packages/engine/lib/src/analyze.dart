import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'body_fat_estimate.dart';
import 'coach_confidence.dart';
import 'coach_snapshot.dart';
import 'cycle_noise.dart';
import 'deurenberg_body_fat.dart';
import 'initial_tdee_prior.dart';
import 'partition.dart';
import 'recommend_mode.dart';
import 'resting_energy_equations.dart';
import 'safety_body_fat.dart';
import 'safety_bounds.dart';
import 'settling_shift.dart';
import 'settling_windows.dart';
import 'targets_record.dart';
import 'tdee_estimator.dart';
import 'tdee_prior.dart';
import 'tdee_status.dart';
import 'weight_event_effects.dart';
import 'weight_trend_model.dart';

/// Analyses stored history. Returns null until there is a weigh-in.
///
/// TDEE is estimated as of yesterday: today's intake is still in progress.
CoachSnapshot? analyze({
  required UserSetup setup,
  required List<WeightObservation> weights,
  required List<IntakeDay> intake,
  required CalendarDate today,
  List<MenstruationDay> flowDays = const [],
  List<WeightEvent> weightEvents = const [],
  List<TargetsRecord> history = const [],
  WeightTrendModel trendModel = const WeightTrendModel(),
  TdeeEstimator estimator = const TdeeEstimator(),
}) {
  if (weights.isEmpty) return null;
  final profile = setup.profile;
  final creatineEvents = creatineWeightEvents(
    events: weightEvents,
    creatineStartedOn: setup.creatineStartedOn,
  );
  final datedCreatineEvents = creatineEvents.where(
    (event) => !event.date.isAfter(today),
  );
  final lastCreatineEventOn = datedCreatineEvents.isEmpty
      ? null
      : datedCreatineEvents
            .map((event) => event.date)
            .reduce((a, b) => a.isAfter(b) ? a : b);
  final passingEvents = effectiveWeightEvents(weightEvents);
  final phaseSettling = settlingWindows(history);
  final settling = [
    ...phaseSettling,
    ...weightEventSettlingWindows(creatineEvents),
  ];
  final cycleNoise = flowDays.isEmpty ? null : cycleNoiseMultiplier(flowDays);
  final eventNoise = passingEvents.isEmpty
      ? null
      : passingWeightEventNoise(passingEvents);
  double Function(CalendarDate)? noiseMultiplier;
  if (cycleNoise != null || eventNoise != null) {
    noiseMultiplier = (date) =>
        math.max(cycleNoise?.call(date) ?? 1, eventNoise?.call(date) ?? 1);
  }
  final transitionShift = combineTrendShifts(
    phaseSettling.isEmpty
        ? null
        : settlingShift(phaseSettling, weights.first.weightKg),
    creatineEvents.isEmpty ? null : creatineEventShift(creatineEvents),
  );
  final trend = trendModel.smooth(
    weights,
    through: today,
    noiseMultiplier: noiseMultiplier,
    shift: transitionShift,
  );
  final trendWeight = trend.last.levelKg;
  // Body mass index is judged on the highest trend weight of the last seven
  // days, so one low reading, or a dip that lasts a day, changes nothing
  // (MM-111).
  final recent = trend.length > 7 ? trend.sublist(trend.length - 7) : trend;
  final policy = CoachingPolicy.derive(
    profile: profile,
    screening: setup.screening,
    today: today,
    weightKg: recent.map((p) => p.levelKg).reduce(math.max),
  );
  final age = profile.ageOn(today);

  final measured = setup.bodyFatPercent;
  final bodyFat = measured != null
      ? BodyFatEstimate(percent: measured, sigmaPercent: 4)
      : deurenbergBodyFat(
          sex: profile.sex,
          weightKg: trendWeight,
          heightCm: profile.heightCm,
          ageYears: age,
        );

  final bmr = mifflinStJeorKcal(
    sex: profile.sex,
    weightKg: trendWeight,
    heightCm: profile.heightCm,
    ageYears: age,
  );
  final asOf = today.addDays(-1);
  final initialPrior = initialTdeePrior(
    bmrKcal: bmr,
    dailyActivity: setup.dailyActivity,
    trainingDaysPerWeek: setup.trainingDaysPerWeek,
  );
  // A transition must not make a previously measured TDEE fall back to the
  // formula prior while its scale change is excluded from the slope.
  final tdee = estimator.estimate(
    asOf: asOf,
    intake: intake,
    trend: trend,
    prior:
        _weightEventPrior(
          history: history,
          creatineEvents: creatineEvents,
          asOf: asOf,
          windowDays: estimator.windowDays,
          profileRevision: setup.profileRevision,
        ) ??
        initialPrior,
    bmrKcal: bmr,
    energyDensityForSlope: (slope) => energyDensityForSlope(
      slopeKgPerDay: slope,
      fatMassKg: bodyFat.fatMassKg(trendWeight),
      resistanceTrained: setup.trainingStatus.isResistanceTrained,
    ),
    settling: settling,
  );

  return CoachSnapshot(
    lastCreatineEventOn: lastCreatineEventOn,
    policy: policy,
    trend: trend,
    trendWeightKg: trendWeight,
    bodyFat: bodyFat,
    bmrKcal: bmr,
    calorieFloorKcal: SafetyBounds.calorieFloorKcal(
      sex: profile.sex,
      bmrKcal: bmr,
      bodyFatPercent: safetyBodyFatPercent(
        bodyFat,
        previous: history.isEmpty ? null : history.last.safetyBodyFatPercent,
      ),
      fatFreeMassUpperKg: bodyFat.fatFreeMassUpperKg(trendWeight),
      trainingKcalPerDay: 0,
    ),
    tdee: tdee,
    confidence: assessCoachConfidence(
      estimate: tdee,
      asOf: today.addDays(-1),
      intake: intake,
      trend: trend,
      history: history,
      lastWeightEventOn:
          creatineEvents.where((event) => !event.date.isAfter(asOf)).isEmpty
          ? null
          : creatineEvents
                .where((event) => !event.date.isAfter(asOf))
                .map((event) => event.date)
                .reduce((a, b) => a.isAfter(b) ? a : b),
    ),
    recommendation: recommendMode(
      sex: profile.sex,
      bodyFatPercent: bodyFat.percent,
      trainingStatus: setup.trainingStatus,
      policy: policy,
    ),
  );
}

TdeePrior? _weightEventPrior({
  required List<TargetsRecord> history,
  required List<WeightEvent> creatineEvents,
  required CalendarDate asOf,
  required int windowDays,
  required int profileRevision,
}) {
  final windowStart = asOf.addDays(1 - windowDays);
  final affectedEvents = creatineEvents.where(
    (event) =>
        !event.date.isAfter(asOf) &&
        !event.date.addDays(weightEventStepDays - 1).isBefore(windowStart),
  );
  if (affectedEvents.isEmpty) return null;
  final mostRecentEvent = affectedEvents
      .map((event) => event.date)
      .reduce((a, b) => a.isAfter(b) ? a : b);
  final priorRecords = history.where(
    (record) =>
        !record.effectiveFrom.isAfter(mostRecentEvent) &&
        record.profileRevision == profileRevision &&
        record.tdeeStatus == TdeeStatus.updated,
  );
  if (priorRecords.isEmpty) return null;
  final previous = priorRecords.last;
  return TdeePrior(kcal: previous.tdeeKcal, sigmaKcal: previous.tdeeSigmaKcal);
}
