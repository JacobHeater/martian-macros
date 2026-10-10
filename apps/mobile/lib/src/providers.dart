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

final weightEventsProvider = StreamProvider<List<WeightEvent>>(
  (ref) => ref.watch(weightEventReaderProvider).watchWeightEvents(),
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

/// The user's own foods and recipes, by name (MM-45).
final customFoodsProvider = StreamProvider<List<CustomFood>>(
  (ref) => ref.watch(customFoodReaderProvider).watchCustomFoods(),
);

/// The setting for the easy-to-miss line (MM-152).
final easyToMissProvider = StreamProvider<EasyToMissPreference>(
  (ref) => ref.watch(easyToMissReaderProvider).watchEasyToMiss(),
);

/// The size of the person's hand for hand portions (MM-46), once set up.
final handSizeProvider = Provider<HandSize?>((ref) {
  final profile = ref.watch(setupProvider).value?.profile;
  return profile == null
      ? null
      : HandSize(heightCm: profile.heightCm, sex: profile.sex);
});

/// How much nutrition to show (MM-49).
final detailLevelProvider = StreamProvider<DetailLevel>(
  (ref) => ref.watch(detailLevelReaderProvider).watchDetailLevel(),
);

final recentFoodsProvider = StreamProvider<List<FoodEntry>>(
  (ref) => ref.watch(recentFoodReaderProvider).watchRecentFoods(),
);

/// The engine's current view of the user; null until setup and a first
/// weigh-in exist.
final coachProvider = Provider<CoachSnapshot?>((ref) {
  final setup = ref.watch(setupProvider).value;
  final weights = ref.watch(weightsProvider).value;
  final weightEvents = ref.watch(weightEventsProvider).value;
  final intake = ref.watch(intakeDaysProvider).value;
  final history = ref.watch(targetsHistoryProvider).value;
  if (setup == null ||
      weights == null ||
      weightEvents == null ||
      intake == null ||
      history == null) {
    return null;
  }
  return analyze(
    setup: setup,
    weights: weights,
    intake: intake,
    history: history,
    weightEvents: weightEvents,
    today: ref.watch(todayProvider),
  );
});

/// What the user did over the seven days to yesterday (MM-149); null until
/// the coach has a first weigh-in.
final adherenceSummaryProvider = Provider<AdherenceSummary?>((ref) {
  final snapshot = ref.watch(coachProvider);
  final intake = ref.watch(intakeDaysProvider).value;
  final weights = ref.watch(weightsProvider).value;
  final history = ref.watch(targetsHistoryProvider).value;
  if (snapshot == null || intake == null || weights == null) return null;
  return summarizeAdherence(
    through: ref.watch(todayProvider).addDays(-1),
    intake: intake,
    weights: weights,
    history: snapshot.policy.targetsAllowed ? history ?? const [] : const [],
    floorKcal: snapshot.calorieFloorKcal,
  );
});

/// When the under-eating notice was last dismissed (MM-114).
final underEatingDismissedProvider = StreamProvider<CalendarDate?>(
  (ref) =>
      ref.watch(underEatingNoticeReaderProvider).watchUnderEatingDismissedOn(),
);

/// What the under-eating rule found over the two weeks to yesterday, whether
/// or not its notice is showing (MM-114).
final underEatingFindingProvider = Provider<UnderEatingFinding?>((ref) {
  final snapshot = ref.watch(coachProvider);
  final intake = ref.watch(intakeDaysProvider).value;
  if (snapshot == null || intake == null) return null;
  return findUnderEating(
    through: ref.watch(todayProvider).addDays(-1),
    intake: intake,
    floorKcal: snapshot.calorieFloorKcal,
  );
});

/// The finding to show now: null when there is none, or it was dismissed in
/// the last two weeks.
final underEatingNoticeProvider = Provider<UnderEatingFinding?>((ref) {
  final finding = ref.watch(underEatingFindingProvider);
  final dismissed = ref.watch(underEatingDismissedProvider);
  if (finding == null || !dismissed.hasValue) return null;
  return underEatingNoticeDue(
        today: ref.watch(todayProvider),
        dismissedOn: dismissed.value,
      )
      ? finding
      : null;
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

/// The first day targets may next change.
CalendarDate nextCheckIn(UserSetup setup, TargetsRecord current) {
  final weekly = current.effectiveFrom.addDays(checkInIntervalDays);
  final calibrated = setup.onboardedOn.addDays(calibrationDays);
  return weekly.isAfter(calibrated) ? weekly : calibrated;
}
