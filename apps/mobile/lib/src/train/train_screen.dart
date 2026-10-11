import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/workout_summary_text.dart';
import '../providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_list_row.dart';
import 'workout_controller_provider.dart';
import 'workout_screen.dart';
import 'weekly_volume_screen.dart';

/// The Train destination (MM-75): start a workout or carry on with the one
/// in progress, and reopen finished ones.
class TrainScreen extends ConsumerWidget {
  const TrainScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workouts = ref.watch(workoutsProvider).value ?? const <Workout>[];
    final today = ref.watch(todayProvider);
    final inProgress = workouts.where((w) => w.inProgress).firstOrNull;
    final finished = [
      for (final workout in workouts)
        if (!workout.inProgress) workout,
    ];
    final text = Theme.of(context).textTheme;

    void open(int workoutId) => Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => WorkoutScreen(workoutId: workoutId),
      ),
    );

    Future<void> start({Workout? from}) async {
      final id = await ref.read(workoutControllerProvider).start(from: from);
      if (context.mounted) open(id);
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (inProgress != null)
          InfoCard(
            key: const ValueKey('train-in-progress'),
            title: 'Workout in progress',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(workoutSummaryText(inProgress), style: text.bodyMedium),
                const SizedBox(height: 12),
                MmButton(
                  key: const ValueKey('train-continue'),
                  label: 'Continue',
                  expand: true,
                  onPressed: () => open(inProgress.id),
                ),
              ],
            ),
          )
        else ...[
          if (finished.isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                'Log your training here, set by set. Strength is one of the '
                'three things the app watches, with your weight trend and '
                'your waist.',
                style: text.bodyLarge,
              ),
            ),
          MmButton(
            key: const ValueKey('train-start'),
            label: 'Start workout',
            expand: true,
            onPressed: start,
          ),
          const SizedBox(height: 16),
          MmButton(
            key: const ValueKey('train-volume'),
            label: 'Weekly training volume',
            kind: MmButtonKind.secondary,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const WeeklyVolumeScreen(),
              ),
            ),
          ),
          if (finished.isNotEmpty) ...[
            const SizedBox(height: 8),
            MmButton(
              key: const ValueKey('train-repeat'),
              label: 'Repeat last workout',
              kind: MmButtonKind.secondary,
              expand: true,
              onPressed: () => start(from: finished.first),
            ),
          ],
        ],
        if (finished.isNotEmpty) ...[
          const SizedBox(height: 16),
          InfoCard(
            key: const ValueKey('train-history'),
            title: 'Workouts',
            child: Column(
              children: [
                for (final workout in finished)
                  MmListRow(
                    key: ValueKey('workout-${workout.id}'),
                    dense: true,
                    title: Fmt.day(workout.date, today),
                    subtitle: workoutSummaryText(workout),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => open(workout.id),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
