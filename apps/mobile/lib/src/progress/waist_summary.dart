import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';

/// "Latest: 91.0 cm on Oct 5 (−1.5 cm since Sep 14)." for the waist card.
String waistSummary(List<WaistObservation> waist, Fmt fmt) {
  final latest = waist.last;
  final change = latest.waistCm - waist.first.waistCm;
  final base =
      'Latest: ${fmt.length(latest.waistCm)} on ${Fmt.shortDay(latest.date)}';
  if (waist.length < 2) return '$base.';
  final v = fmt.lengthFromCm(change);
  final sign = v > 0 ? '+' : (v < 0 ? '−' : '');
  return '$base ($sign${v.abs().toStringAsFixed(1)} ${fmt.lengthUnit} '
      'since ${Fmt.shortDay(waist.first.date)}).';
}
