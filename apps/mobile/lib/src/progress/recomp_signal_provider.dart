import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../providers.dart';
import 'strength_trends_provider.dart';

/// The recomp signal as of today (MM-32), from what is logged. Null until
/// the weight trend exists.
final recompSignalProvider = Provider<RecompSignal?>((ref) {
  final trend = ref.watch(coachProvider)?.trend;
  if (trend == null) return null;
  return recompSignalOf(
    trend: trend,
    weights: ref.watch(weightsProvider).value ?? const [],
    waist: ref.watch(waistProvider).value ?? const [],
    strengthTrends: ref.watch(strengthTrendsProvider).value ?? const [],
    today: ref.watch(todayProvider),
  );
});
