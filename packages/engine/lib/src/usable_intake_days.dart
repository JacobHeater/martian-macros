import 'package:mm_domain/mm_domain.dart';

/// The days of [days] that can be taken as whole days of eating (MM-27): a
/// day marked complete always, a day marked partial never, and an unmarked
/// day when it is not far below the window's typical intake (at least
/// [partialDayFraction] of the 75th percentile, which stays among the fully
/// logged days even when a third of days are partial).
///
/// One rule for the expenditure estimate, the adherence summary (MM-149) and
/// the under-eating notice (MM-114), so they always agree on which days count.
List<IntakeDay> usableIntakeDays(
  List<IntakeDay> days, {
  double partialDayFraction = 0.65,
}) {
  final candidates = days
      .where((d) => d.completeness != DayCompleteness.partial)
      .toList();
  if (candidates.isEmpty) return const [];
  final typical = _percentile([for (final d in candidates) d.kcal], 0.75);
  final threshold = typical * partialDayFraction;
  return [
    for (final d in candidates)
      if (d.completeness == DayCompleteness.complete ||
          (d.kcal > 0 && d.kcal >= threshold))
        d,
  ];
}

/// Linear-interpolated percentile, [p] in 0–1.
double _percentile(List<double> values, double p) {
  final sorted = [...values]..sort();
  final rank = p * (sorted.length - 1);
  final lo = rank.floor();
  final hi = rank.ceil();
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}
