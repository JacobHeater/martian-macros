import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../app/home_destination.dart';
import '../app/home_tab_provider.dart';
import '../coach/insight_card.dart';
import '../coach/under_eating_notice.dart';
import '../food/calorie_hero.dart';
import '../food/selected_day_provider.dart';
import '../food/targets_on.dart';
import '../format/fmt.dart';
import '../format/coach_confidence_text.dart';
import '../pause/pause_screen.dart';
import '../providers.dart';
import '../reminders/reminder_paused_notice.dart';
import '../repository_role_providers.dart';
import '../ui/macro_kind.dart';
import 'coach_line_text.dart';
import 'weight_card.dart';

/// How the user is doing today, with a way into each detail screen.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const SizedBox.shrink();
    final today = ref.watch(todayProvider);
    final entries = ref.watch(foodForDayProvider(today)).value ?? const [];
    final history = ref.watch(targetsHistoryProvider).value ?? const [];
    final weights = ref.watch(weightsProvider).value ?? const [];
    final coach = ref.watch(coachProvider);
    final trend = coach?.trend ?? const [];
    final fmt = Fmt(setup.unitSystem);
    final pause = ref.watch(activePauseProvider);
    final targetsAllowed = CoachingPolicy.derive(
      profile: setup.profile,
      screening: setup.screening,
      today: today,
    ).targetsAllowed;

    void open(HomeDestination destination) =>
        ref.read(homeTabProvider.notifier).select(destination);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 112),
      children: [
        const UnderEatingNotice(),
        const ReminderPausedNotice(),
        CalorieHero(
          intake: intakeDayFrom(today, entries),
          targets: pause != null
              ? ref.watch(maintenanceGuideProvider)
              : targetsOn(
                  history,
                  today,
                  targetsAllowed: targetsAllowed,
                )?.targets,
          paused: pause != null,
          macros: const [MacroKind.protein],
          status: pause != null
              ? 'Paused until ${Fmt.day(pause.to, today)}. Nothing is '
                    'counted against you.'
              : coachLineText(
                  setup: setup,
                  history: history,
                  today: today,
                  confidence:
                      coach?.confidence.level ?? ConfidenceLevel.learning,
                ),
          confidence: coach == null || pause != null
              ? null
              : confidenceLabel(coach.confidence.level),
          onStatusTap: pause != null
              ? () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const PauseScreen()),
                )
              : () => open(HomeDestination.coach),
          onTap: () {
            ref.read(selectedDayProvider.notifier).set(null);
            open(HomeDestination.food);
          },
        ),
        WeightCard(
          trend: trend,
          weighedInToday: weights.any((w) => w.date == today),
          fmt: fmt,
          onSaveWeight: (kg) =>
              ref.read(weightWriterProvider).saveWeight(today, kg),
          onTap: () => open(HomeDestination.progress),
        ),
        const InsightCard(),
      ],
    );
  }
}
