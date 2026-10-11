import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../progress/strength_trends_provider.dart';
import '../providers.dart';

/// The recomp review due today, if one is (MM-133). Not during a pause,
/// which is not time on recomp.
final recompReviewProvider = Provider<RecompReview?>((ref) {
  final snapshot = ref.watch(coachProvider);
  final history = ref.watch(targetsHistoryProvider).value;
  if (snapshot == null ||
      history == null ||
      !snapshot.policy.targetsAllowed ||
      ref.watch(activePauseProvider) != null) {
    return null;
  }
  return recompReviewOf(
    history: history,
    trend: snapshot.trend,
    waist: ref.watch(waistProvider).value ?? const [],
    strengthTrends: ref.watch(strengthTrendsProvider).value ?? const [],
    recommendation: snapshot.recommendation,
    today: ref.watch(todayProvider),
  );
});
