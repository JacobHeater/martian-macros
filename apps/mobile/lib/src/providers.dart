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

/// Every pause the user has set (MM-148).
final pausesProvider = StreamProvider<List<Pause>>(
  (ref) => ref.watch(pauseReaderProvider).watchPauses(),
);

/// The pause covering today, if any.
final activePauseProvider = Provider<Pause?>(
  (ref) => pauseOn(
    ref.watch(pausesProvider).value ?? const [],
    ref.watch(todayProvider),
  ),
);

/// Whether a pause touches the [days] days up to today. Summaries and
/// insights over such a stretch say nothing: a paused day is not judged
/// (MM-148).
bool pauseWithin(Ref ref, int days) {
  final today = ref.watch(todayProvider);
  return pausedDaysBetween(
        ref.watch(pausesProvider).value ?? const [],
        today.addDays(-days),
        today,
      ) >
      0;
}

/// Intake for anything that judges a day: paused days are left out.
final judgedIntakeProvider = Provider<List<IntakeDay>?>((ref) {
  final intake = ref.watch(intakeDaysProvider).value;
  if (intake == null) return null;
  return withoutPausedDays(
    intake,
    ref.watch(pausesProvider).value ?? const [],
    keepComplete: false,
  );
});

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
  final pauses = ref.watch(pausesProvider).value;
  if (setup == null ||
      weights == null ||
      weightEvents == null ||
      intake == null ||
      history == null ||
      pauses == null) {
    return null;
  }
  return analyze(
    setup: setup,
    weights: weights,
    intake: intake,
    history: history,
    weightEvents: weightEvents,
    pauses: pauses,
    today: ref.watch(todayProvider),
  );
});

/// The guide shown in place of targets on a paused day (MM-148):
/// maintenance. Null when the app shows this person no targets.
final maintenanceGuideProvider = Provider<DailyTargets?>((ref) {
  final setup = ref.watch(setupProvider).value;
  final snapshot = ref.watch(coachProvider);
  if (setup == null || snapshot == null || !snapshot.policy.targetsAllowed) {
    return null;
  }
  return pausedGuide(setup: setup, snapshot: snapshot);
});

/// What the user did over the seven days to yesterday (MM-149); null until
/// the coach has a first weigh-in.
final adherenceSummaryProvider = Provider<AdherenceSummary?>((ref) {
  final snapshot = ref.watch(coachProvider);
  final intake = ref.watch(judgedIntakeProvider);
  final weights = ref.watch(weightsProvider).value;
  final history = ref.watch(targetsHistoryProvider).value;
  if (snapshot == null || intake == null || weights == null) return null;
  if (pauseWithin(ref, 7)) return null;
  return summarizeAdherence(
    through: ref.watch(todayProvider).addDays(-1),
    intake: intake,
    weights: weights,
    history: snapshot.policy.targetsAllowed ? history ?? const [] : const [],
    floorKcal: snapshot.calorieFloorKcal,
  );
});

/// Whether progress has stalled against the goal, and which kind of stall it
/// is (MM-140); null until the coach has what it needs to look.
final stallAssessmentProvider = Provider<StallAssessment?>((ref) {
  final setup = ref.watch(setupProvider).value;
  final snapshot = ref.watch(coachProvider);
  final intake = ref.watch(judgedIntakeProvider);
  final weights = ref.watch(weightsProvider).value;
  final history = ref.watch(targetsHistoryProvider).value;
  if (setup == null ||
      snapshot == null ||
      intake == null ||
      weights == null ||
      history == null ||
      !snapshot.policy.targetsAllowed ||
      pauseWithin(ref, 14)) {
    return null;
  }
  return assessStall(
    setup: setup,
    snapshot: snapshot,
    history: history,
    intake: intake,
    weights: weights,
    waist: ref.watch(waistProvider).value ?? const [],
    weightEvents: ref.watch(weightEventsProvider).value ?? const [],
    today: ref.watch(todayProvider),
  );
});

/// Which insights have been shown and dismissed (MM-141).
final insightLogProvider = StreamProvider<List<InsightLogEntry>>(
  (ref) => ref.watch(insightLogReaderProvider).watchInsightLog(),
);

/// The one insight to show today, if any (MM-141): the catalog's rules run
/// over the data to yesterday, then rationed against what was already shown.
final insightSelectionProvider = Provider<InsightSelection?>((ref) {
  final setup = ref.watch(setupProvider).value;
  final intake = ref.watch(judgedIntakeProvider);
  final weights = ref.watch(weightsProvider).value;
  final history = ref.watch(targetsHistoryProvider).value;
  final log = ref.watch(insightLogProvider).value;
  if (setup == null ||
      intake == null ||
      weights == null ||
      history == null ||
      log == null ||
      ref.watch(coachProvider) == null ||
      pauseWithin(ref, InsightRationing.patternDays)) {
    return null;
  }
  final today = ref.watch(todayProvider);
  return selectInsight(
    candidates: findInsights(
      through: today.addDays(-1),
      intake: intake,
      weights: weights,
      history: history,
      stall: ref.watch(stallAssessmentProvider),
      limitToProteinAndLogging: setup.screening.eatingDisorderHistory,
    ),
    log: log,
    today: today,
  );
});

/// When the welcome-back screen was last put off (MM-147).
final returnScreenDismissedProvider = StreamProvider<CalendarDate?>(
  (ref) => ref.watch(returnScreenReaderProvider).watchReturnScreenDismissedOn(),
);

/// Whether to show the welcome-back screen: the user is returning from a gap
/// today and has not put the screen off since it began (MM-147).
final welcomeBackDueProvider = Provider<bool>((ref) {
  final weights = ref.watch(weightsProvider).value;
  final intake = ref.watch(intakeDaysProvider).value;
  final dismissed = ref.watch(returnScreenDismissedProvider);
  if (weights == null || intake == null || !dismissed.hasValue) return false;
  final gap = openGap(
    weights: weights,
    intake: intake,
    today: ref.watch(todayProvider),
    pauses: ref.watch(pausesProvider).value ?? const [],
  );
  if (gap == null) return false;
  final putOff = dismissed.value;
  return putOff == null || putOff.isBefore(gap.from);
});

/// Whether to show the resume screen: a pause has ended, no weigh-in has
/// been saved since, and the screen has not been put off since it ended
/// (MM-148).
final resumeDueProvider = Provider<bool>((ref) {
  final weights = ref.watch(weightsProvider).value;
  final pauses = ref.watch(pausesProvider).value;
  final dismissed = ref.watch(returnScreenDismissedProvider);
  if (weights == null || pauses == null || !dismissed.hasValue) return false;
  final pause = pauseToResume(
    pauses: pauses,
    weights: weights,
    today: ref.watch(todayProvider),
  );
  if (pause == null) return false;
  final putOff = dismissed.value;
  return putOff == null || !putOff.isAfter(pause.to);
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
  final intake = ref.watch(judgedIntakeProvider);
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

/// Every weekly recovery check-in, oldest first (MM-116).
final recoveryCheckInsProvider = StreamProvider<List<RecoveryCheckIn>>(
  (ref) => ref.watch(recoveryCheckInReaderProvider).watchRecoveryCheckIns(),
);

/// When the recovery check-in was last skipped.
final recoverySkippedProvider = StreamProvider<CalendarDate?>(
  (ref) =>
      ref.watch(recoverySkipReaderProvider).watchRecoveryCheckInSkippedOn(),
);

/// Whether to offer the weekly recovery check-in now (MM-116).
final recoveryCheckInDueProvider = Provider<bool>((ref) {
  final setup = ref.watch(setupProvider).value;
  final checkIns = ref.watch(recoveryCheckInsProvider).value;
  final skipped = ref.watch(recoverySkippedProvider);
  if (setup == null || checkIns == null || !skipped.hasValue) return false;
  return recoveryCheckInDue(
    today: ref.watch(todayProvider),
    onboardedOn: setup.onboardedOn,
    checkIns: checkIns,
    skippedOn: skipped.value,
    paused: ref.watch(activePauseProvider) != null,
  );
});

/// The reminder settings the user has stored (MM-146).
final remindersProvider = StreamProvider<List<ReminderSetting>>(
  (ref) => ref.watch(reminderReaderProvider).watchReminders(),
);

/// Every reminder's setting: what is stored, or off at its default time.
final reminderSettingsProvider = Provider<List<ReminderSetting>>((ref) {
  final stored = ref.watch(remindersProvider).value ?? const [];
  return [
    for (final kind in ReminderKind.values)
      stored.where((s) => s.kind == kind).firstOrNull ??
          ReminderSetting(
            kind: kind,
            minuteOfDay: ReminderRule.defaultMinuteOfDay(kind),
          ),
  ];
});

/// What the reminder rules need to know; null until the data has loaded.
final reminderFactsProvider = Provider<ReminderFacts?>((ref) {
  final weights = ref.watch(weightsProvider).value;
  final intake = ref.watch(intakeDaysProvider).value;
  final waist = ref.watch(waistProvider).value;
  final pauses = ref.watch(pausesProvider).value;
  if (weights == null || intake == null || waist == null || pauses == null) {
    return null;
  }
  return ReminderFacts(
    weighInDays: [for (final w in weights) w.date],
    foodDays: [
      for (final d in intake)
        if (d.kcal > 0) d.date,
    ],
    waistDays: [for (final w in waist) w.date],
    pauses: pauses,
  );
});

/// The minutes after midnight now.
int _minuteNow(Ref ref) => minuteOfDayNow(ref.watch(clockProvider));

/// The minutes after midnight on [clock].
int minuteOfDayNow(Clock clock) {
  final now = clock.now();
  return now.hour * 60 + now.minute;
}

/// The reminders the device should have scheduled (MM-146). Null until the
/// data has loaded, and while no reminder has ever been set, so that the
/// scheduler is not touched for a user who never turned one on.
final reminderPlanProvider = Provider<List<PlannedReminder>?>((ref) {
  final stored = ref.watch(remindersProvider).value;
  final facts = ref.watch(reminderFactsProvider);
  if (stored == null || stored.isEmpty || facts == null) return null;
  return planReminders(
    settings: stored,
    facts: facts,
    today: ref.watch(todayProvider),
    minuteNow: _minuteNow(ref),
  );
});

/// The reminders that have gone unanswered seven times and paused
/// themselves.
final selfPausedRemindersProvider = Provider<List<ReminderSetting>>((ref) {
  final stored = ref.watch(remindersProvider).value;
  final facts = ref.watch(reminderFactsProvider);
  if (stored == null || facts == null) return const [];
  final today = ref.watch(todayProvider);
  final minuteNow = _minuteNow(ref);
  return [
    for (final setting in stored)
      if (reminderIgnoredStreak(
            setting: setting,
            facts: facts,
            today: today,
            minuteNow: minuteNow,
          ) >=
          ReminderRule.ignoredLimit)
        setting,
  ];
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
