import 'calendar_date.dart';

/// One body-weight reading selected for its calendar day.
final class WeightObservation {
  const WeightObservation({
    required this.date,
    required this.weightKg,
    this.deviceId,
  });

  final CalendarDate date;
  final double weightKg;

  /// Platform source identifier (HealthKit source / Health Connect
  /// dataOrigin); null for manual entry.
  final String? deviceId;
}

enum BodyFatMethod { bia, navyTape, skinfold, dexa }

/// A body-fat estimate from any method. Each device gets its own bias state,
/// so switching scales never reads as a body-composition change.
final class BodyFatObservation {
  const BodyFatObservation({
    required this.date,
    required this.percent,
    required this.method,
    this.deviceId,
  });

  final CalendarDate date;
  final double percent;
  final BodyFatMethod method;
  final String? deviceId;
}

/// Waist circumference at the navel; median of three readings.
final class WaistObservation {
  const WaistObservation({required this.date, required this.waistCm});

  final CalendarDate date;
  final double waistCm;
}

/// A day with menstrual flow recorded. Used to widen weight and BIA noise
/// around menses rather than mistaking water shifts for tissue change.
final class MenstruationDay {
  const MenstruationDay(this.date);

  final CalendarDate date;
}

/// Whether a logged day represents everything the user ate.
enum DayCompleteness {
  /// User confirmed the day is fully logged.
  complete,

  /// User marked the day as partially logged; its intake is never used.
  partial,

  /// Not marked; the engine classifies it heuristically.
  unmarked,
}

/// Aggregated intake for one calendar day.
final class IntakeDay {
  const IntakeDay({
    required this.date,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.completeness = DayCompleteness.unmarked,
    this.relativeSigma = 0.10,
    this.weighedShare = 0,
  });

  final CalendarDate date;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final DayCompleteness completeness;

  /// Combined measurement uncertainty of the day's energy total; see
  /// `dailyRelativeSigma`.
  final double relativeSigma;

  /// Fraction of the day's energy logged as weighed entries (0–1). A sudden
  /// change signals a logging-style switch and so a shift in logging bias.
  final double weighedShare;
}
