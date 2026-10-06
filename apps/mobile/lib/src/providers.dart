import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// Build environment from `--dart-define-from-file=config/<env>.json`.
const appEnv = String.fromEnvironment('MM_ENV', defaultValue: 'dev');

/// The local database. Overridden with an in-memory database in tests.
final storeProvider = Provider<MmStore>((ref) {
  final store = MmStore(AppDatabase(driftDatabase(name: 'martian_macros')));
  ref.onDispose(store.close);
  return store;
});

/// The user's current calendar day. Invalidated when the app resumes, so a
/// session left open overnight rolls over.
final todayProvider = Provider<CalendarDate>(
  (ref) => CalendarDate.fromDateTime(DateTime.now()),
);

final setupProvider = StreamProvider<UserSetup?>(
  (ref) => ref.watch(storeProvider).watchSetup(),
);

final weightsProvider = StreamProvider<List<WeightObservation>>(
  (ref) => ref.watch(storeProvider).watchWeights(),
);

final waistProvider = StreamProvider<List<WaistObservation>>(
  (ref) => ref.watch(storeProvider).watchWaist(),
);

/// Intake for the engine: the last 60 days is more than any window needs.
final intakeDaysProvider = StreamProvider<List<IntakeDay>>((ref) {
  final since = ref.watch(todayProvider).addDays(-60);
  return ref.watch(storeProvider).watchIntakeDays(since: since);
});

final targetsHistoryProvider = StreamProvider<List<TargetsRecord>>(
  (ref) => ref.watch(storeProvider).watchTargetsHistory(),
);

final foodForDayProvider = StreamProvider.family<List<FoodEntry>, CalendarDate>(
  (ref, date) => ref.watch(storeProvider).watchFood(date),
);

final completenessProvider =
    StreamProvider.family<DayCompleteness, CalendarDate>(
      (ref, date) => ref.watch(storeProvider).watchCompleteness(date),
    );

final recentFoodsProvider = StreamProvider<List<FoodEntry>>(
  (ref) => ref.watch(storeProvider).watchRecentFoods(),
);

/// The engine's current view of the user; null until setup and a first
/// weigh-in exist.
final coachProvider = Provider<CoachSnapshot?>((ref) {
  final setup = ref.watch(setupProvider).value;
  final weights = ref.watch(weightsProvider).value;
  final intake = ref.watch(intakeDaysProvider).value;
  if (setup == null || weights == null || intake == null) return null;
  return analyze(
    setup: setup,
    weights: weights,
    intake: intake,
    today: ref.watch(todayProvider),
  );
});

/// The targets in force today, if any have been issued.
final currentTargetsProvider = Provider<TargetsRecord?>((ref) {
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
  if (next != null) ref.read(storeProvider).saveTargets(next);
});

/// The first day targets may next change.
CalendarDate nextCheckIn(UserSetup setup, TargetsRecord current) {
  final weekly = current.effectiveFrom.addDays(checkInIntervalDays);
  final calibrated = setup.onboardedOn.addDays(calibrationDays);
  return weekly.isAfter(calibrated) ? weekly : calibrated;
}
