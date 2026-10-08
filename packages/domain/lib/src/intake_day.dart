import 'calendar_date.dart';
import 'day_completeness.dart';

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
