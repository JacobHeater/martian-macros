import 'package:mm_domain/mm_domain.dart';

import 'measured_change.dart';
import 'waist_change.dart';
import 'waist_rule.dart';

/// Whether the waist changed over the [days] up to [asOf] (MM-155), or
/// null when there is not a measurement at both ends to compare.
///
/// The comparison is between smoothed values, never single entries: the
/// middle value of the latest three entries against that of the three
/// nearest the day [days] ago. The latest entry has to be from the last
/// two weeks. A difference is a change only when it exceeds the noise of a
/// difference, 1.4 times [noiseCm]; inside that it is no clear change.
///
/// With [sinceStart], the comparison is with the first three entries ever
/// instead, so the starting point is not one noisy reading.
WaistChange? waistChangeOf({
  required Iterable<WaistObservation> waist,
  required CalendarDate asOf,
  int days = 28,
  bool sinceStart = false,
  double noiseCm = WaistRule.medianOfThreeNoiseCm,
}) {
  final entries = [
    for (final entry in waist)
      if (!entry.date.isAfter(asOf)) entry,
  ]..sort((a, b) => a.date.compareTo(b.date));
  if (entries.isEmpty ||
      entries.last.date.daysUntil(asOf) >= WaistRule.latestWithinDays) {
    return null;
  }

  double middle(List<WaistObservation> of) {
    final sorted = [for (final entry in of) entry.waistCm]..sort();
    final mid = sorted.length ~/ 2;
    return sorted.length.isOdd
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  final List<WaistObservation> recent;
  final List<WaistObservation> baseline;
  if (sinceStart) {
    // Each end gets up to three entries, and no entry is at both.
    final first = entries.length ~/ 2 < WaistRule.smoothedEntries
        ? entries.length ~/ 2
        : WaistRule.smoothedEntries;
    baseline = entries.sublist(0, first);
    final rest = entries.sublist(first);
    recent = rest.length <= WaistRule.smoothedEntries
        ? rest
        : rest.sublist(rest.length - WaistRule.smoothedEntries);
  } else {
    final fresh = [
      for (final entry in entries)
        if (entry.date.daysUntil(asOf) < WaistRule.recentWithinDays) entry,
    ];
    recent = fresh.length <= WaistRule.smoothedEntries
        ? fresh
        : fresh.sublist(fresh.length - WaistRule.smoothedEntries);
    final target = asOf.addDays(-days);
    final near =
        [
          for (final entry in entries)
            if (entry.date.isBefore(recent.first.date) &&
                (entry.date.daysUntil(target)).abs() <=
                    WaistRule.baselineWithinDays)
              entry,
        ]..sort((a, b) {
          final byDistance = a.date
              .daysUntil(target)
              .abs()
              .compareTo(b.date.daysUntil(target).abs());
          return byDistance != 0 ? byDistance : a.date.compareTo(b.date);
        });
    baseline = near.take(WaistRule.smoothedEntries).toList();
  }
  if (recent.isEmpty || baseline.isEmpty) return null;

  final from = middle(baseline);
  final to = middle(recent);
  final threshold = WaistRule.differenceFactor * noiseCm;
  // A hair of tolerance, so a change of exactly the threshold counts
  // whatever the arithmetic did to its last digit.
  final change = to - from;
  return WaistChange(
    direction: change <= -threshold + 1e-9
        ? MeasuredChange.down
        : change >= threshold - 1e-9
        ? MeasuredChange.up
        : MeasuredChange.noClearChange,
    fromCm: from,
    toCm: to,
    thresholdCm: threshold,
    recentEntries: recent.length,
    baselineEntries: baseline.length,
  );
}
