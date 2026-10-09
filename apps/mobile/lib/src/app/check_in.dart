import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../providers.dart';
import '../repository_role_providers.dart';

final checkInProvider = NotifierProvider<CheckIn, Set<int>>(CheckIn.new);

/// Persists engine decisions and records target changes generated this launch,
/// so their summaries wait until the next app opening.
class CheckIn extends Notifier<Set<int>> {
  final _generatedThisLaunch = <int>{};

  @override
  Set<int> build() {
    final setup = ref.watch(setupProvider).value;
    final snapshot = ref.watch(coachProvider);
    final history = ref.watch(targetsHistoryProvider).value;
    if (setup == null || snapshot == null || history == null) {
      return Set.unmodifiable(_generatedThisLaunch);
    }
    final next = nextTargets(
      setup: setup,
      snapshot: snapshot,
      history: history,
      today: ref.watch(todayProvider),
    );
    if (next == null) return Set.unmodifiable(_generatedThisLaunch);
    if (next.explanation?.previousKcal != null) {
      _generatedThisLaunch.add(next.effectiveFrom.epochDay);
    }

    // Targets first: the goal change below re-runs this provider.
    final saved = ref.read(targetsHistoryWriterProvider).saveTargets(next);
    if (next.mode == GoalMode.maintenance &&
        setup.goalMode != GoalMode.maintenance) {
      // Low body weight (MM-111) or a health check answer (MM-83) ruled the
      // goal out: make maintenance the user's goal, so a deficit does not
      // resume by itself when the reason goes away.
      saved.then(
        (_) => ref
            .read(setupWriterProvider)
            .saveSetup(setup.copyWith(goalMode: GoalMode.maintenance)),
      );
    }
    return Set.unmodifiable(_generatedThisLaunch);
  }
}
