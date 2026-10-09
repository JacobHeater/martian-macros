import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'integration_providers.dart';
import 'repository_role_providers.dart';

/// Build environment from `--dart-define-from-file=config/<env>.json`.
const appEnv = String.fromEnvironment('MM_ENV', defaultValue: 'dev');

/// The build environment (`dev` or `prod`). Overridable so tests can check
/// what production hides.
final appEnvProvider = Provider<String>((ref) => appEnv);

/// The user's current calendar day. Invalidated when the app resumes, so a
/// session left open overnight rolls over.
final todayProvider = Provider<CalendarDate>(
  (ref) => ref.watch(clockProvider).today(),
);

final setupProvider = StreamProvider<UserSetup?>(
  (ref) => ref.watch(setupReaderProvider).watchSetup(),
);

/// Light, dark or follow the phone (MM-165).
final themePreferenceProvider = StreamProvider<ThemePreference>(
  (ref) => ref.watch(preferencesReaderProvider).watchThemePreference(),
);

/// The evidence register shipped with the app (MM-143).
final evidenceRegisterProvider = FutureProvider<EvidenceRegister>(
  (ref) async =>
      EvidenceRegister.parse(await rootBundle.loadString('assets/evidence.md')),
);

final weightsProvider = StreamProvider<List<WeightObservation>>(
  (ref) => ref.watch(weightReaderProvider).watchWeights(),
);

final waistProvider = StreamProvider<List<WaistObservation>>(
  (ref) => ref.watch(waistReaderProvider).watchWaist(),
);

/// Intake for the engine: the last 60 days is more than any window needs.
final intakeDaysProvider = StreamProvider<List<IntakeDay>>((ref) {
  final since = ref.watch(todayProvider).addDays(-60);
  return ref.watch(intakeReaderProvider).watchIntakeDays(since: since);
});

final targetsHistoryProvider = StreamProvider<List<TargetsRecord>>(
  (ref) => ref.watch(targetsHistoryReaderProvider).watchTargetsHistory(),
);

final foodForDayProvider = StreamProvider.family<List<FoodEntry>, CalendarDate>(
  (ref, date) => ref.watch(foodDayReaderProvider).watchFood(date),
);

final completenessProvider =
    StreamProvider.family<DayCompleteness, CalendarDate>(
      (ref, date) => ref.watch(dayMarkReaderProvider).watchCompleteness(date),
    );

final recentFoodsProvider = StreamProvider<List<FoodEntry>>(
  (ref) => ref.watch(recentFoodReaderProvider).watchRecentFoods(),
);

/// The engine's current view of the user; null until setup and a first
/// weigh-in exist.
final coachProvider = Provider<CoachSnapshot?>((ref) {
  final setup = ref.watch(setupProvider).value;
  final weights = ref.watch(weightsProvider).value;
  final intake = ref.watch(intakeDaysProvider).value;
  final history = ref.watch(targetsHistoryProvider).value;
  if (setup == null || weights == null || intake == null || history == null) {
    return null;
  }
  return analyze(
    setup: setup,
    weights: weights,
    intake: intake,
    history: history,
    today: ref.watch(todayProvider),
  );
});

/// The targets in force today, if any have been issued.
final currentTargetsProvider = Provider<TargetsRecord?>((ref) {
  final setup = ref.watch(setupProvider).value;
  if (setup == null ||
      !CoachingPolicy.derive(
        profile: setup.profile,
        screening: setup.screening,
        today: ref.watch(todayProvider),
      ).targetsAllowed) {
    return null;
  }
  final history = ref.watch(targetsHistoryProvider).value;
  return history == null || history.isEmpty ? null : history.last;
});

/// Runs the check-in: whenever the engine says targets should change,
/// persists them. Watching this provider keeps it active. Saving is
/// idempotent (one record per effective day), and once saved the engine
/// stops asking.
final checkInProvider = Provider<void>((ref) {
  final setup = ref.watch(setupProvider).value;
  final snapshot = ref.watch(coachProvider);
  final history = ref.watch(targetsHistoryProvider).value;
  if (setup == null || snapshot == null || history == null) return;
  final next = nextTargets(
    setup: setup,
    snapshot: snapshot,
    history: history,
    today: ref.watch(todayProvider),
  );
  if (next == null) return;
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
});

/// The first day targets may next change.
CalendarDate nextCheckIn(UserSetup setup, TargetsRecord current) {
  final weekly = current.effectiveFrom.addDays(checkInIntervalDays);
  final calibrated = setup.onboardedOn.addDays(calibrationDays);
  return weekly.isAfter(calibrated) ? weekly : calibrated;
}
