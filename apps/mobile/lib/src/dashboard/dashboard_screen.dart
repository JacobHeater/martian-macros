import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../app/home_destination.dart';
import '../app/home_tab_provider.dart';
import '../food/selected_day_provider.dart';
import '../food/targets_on.dart';
import '../format/fmt.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import 'coach_line_card.dart';
import 'coach_line_text.dart';
import 'intake_card.dart';
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
    final trend = ref.watch(coachProvider)?.trend ?? const [];
    final fmt = Fmt(setup.unitSystem);

    void open(HomeDestination destination) =>
        ref.read(homeTabProvider.notifier).select(destination);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        IntakeCard(
          intake: intakeDayFrom(today, entries),
          targets: targetsOn(history, today)?.targets,
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
        CoachLineCard(
          text: coachLineText(setup: setup, history: history, today: today),
          onTap: () => open(HomeDestination.coach),
        ),
      ],
    );
  }
}
