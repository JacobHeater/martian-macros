import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// A simulated person with a known true physiology and realistic logging
/// and weigh-in behaviour. Deterministic for a given seed.
///
/// Truth model: weight changes by (actual intake − true TDEE) / ρ, where ρ
/// comes from the same Forbes/Hall partition the engine assumes; true TDEE
/// adapts by [adaptationKcalPerKg] per kg lost; day-to-day weigh-ins carry
/// AR(1) water noise plus scale noise.
final class SyntheticUser {
  SyntheticUser({
    required int seed,
    CalendarDate? start,
    this.baseTdeeKcal = 2600,
    this.startWeightKg = 85,
    double bodyFatPercent = 25,
    this.underReportFraction = 0,
    this.entrySigma = 0.08,
    this.adherenceSigmaKcal = 150,
    this.skipLogProbability = 0.05,
    this.partialLogProbability = 0,
    this.skipWeighInProbability = 0.15,
    this.waterSigmaKg = 0.5,
    this.waterPersistence = 0.65,
    this.weighedShare = 0,
    this.resistanceTrained = true,
    this.adaptationKcalPerKg = 22,
  }) : _random = math.Random(seed),
       today = start ?? CalendarDate(2026, 1, 1),
       weightKg = startWeightKg,
       fatMassKg = startWeightKg * bodyFatPercent / 100;

  final math.Random _random;
  final double baseTdeeKcal;
  final double startWeightKg;
  final double entrySigma;
  final double adherenceSigmaKcal;
  final double skipWeighInProbability;
  final double waterSigmaKg;
  final double waterPersistence;
  final bool resistanceTrained;
  final double adaptationKcalPerKg;

  // Mutable so tests can change behaviour mid-run.
  double underReportFraction;
  double skipLogProbability;
  double partialLogProbability;
  double weighedShare;

  CalendarDate today;
  double weightKg;
  double fatMassKg;
  double _water = 0;

  double get trueTdeeKcal =>
      baseTdeeKcal + adaptationKcalPerKg * (weightKg - startWeightKg);

  double get bodyFatPercent => 100 * fatMassKg / weightKg;

  /// Lives one day eating to [targetLoggedKcal] (in logging units).
  ({IntakeDay? intake, WeightObservation? weight}) liveDay(
    double targetLoggedKcal,
  ) {
    final ar = waterPersistence;
    _water = ar * _water + _gauss() * waterSigmaKg * math.sqrt(1 - ar * ar);
    final weighIn = _random.nextDouble() < skipWeighInProbability
        ? null
        : WeightObservation(
            date: today,
            weightKg: weightKg + _water + _gauss() * 0.1,
          );

    // The user eats what they believe is the target; under-reporting means
    // they actually eat more than they log.
    final actual =
        targetLoggedKcal / (1 - underReportFraction) +
        _gauss() * adherenceSigmaKcal;
    var logged =
        actual * (1 - underReportFraction) * (1 + _gauss() * entrySigma);

    IntakeDay? intake;
    if (_random.nextDouble() >= skipLogProbability) {
      final partial = _random.nextDouble() < partialLogProbability;
      if (partial) logged *= 0.3 + 0.3 * _random.nextDouble();
      intake = IntakeDay(
        date: today,
        kcal: logged,
        proteinG: logged * 0.3 / 4,
        carbsG: logged * 0.4 / 4,
        fatG: logged * 0.3 / 9,
        relativeSigma: entrySigma,
        weighedShare: weighedShare,
      );
    }

    final balance = actual - trueTdeeKcal;
    final leanFraction = leanFractionOfChange(
      fatMassKg: fatMassKg,
      losing: balance < 0,
      resistanceTrained: resistanceTrained,
    );
    final deltaKg = balance / energyDensityKcalPerKg(leanFraction);
    weightKg += deltaKg;
    fatMassKg += deltaKg * (1 - leanFraction);
    today = today.addDays(1);
    return (intake: intake, weight: weighIn);
  }

  double _gauss() {
    final u1 = 1 - _random.nextDouble();
    final u2 = _random.nextDouble();
    return math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2);
  }
}
