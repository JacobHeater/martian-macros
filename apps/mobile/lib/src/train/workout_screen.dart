import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/workout_summary_text.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_icon_button.dart';
import '../ui/show_mm_confirm.dart';
import 'exercise_picker_screen.dart';
import 'set_timer_bar.dart';
import 'workout_clock_card.dart';
import 'workout_controller_provider.dart';
import 'workout_exercise_card.dart';

/// One workout (MM-75): in progress, to log sets as they are done, or
/// finished, to look at and correct.
class WorkoutScreen extends ConsumerWidget {
  const WorkoutScreen({required this.workoutId, super.key});

  final int workoutId;

  static bool _hasWork(Workout workout) => workout.exercises.any(
    (exercise) => exercise.sets.any((set) => set.reps > 0),
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workouts = ref.watch(workoutsProvider).value ?? const [];
    final workout = workouts.where((w) => w.id == workoutId).firstOrNull;
    if (workout == null) {
      // Deleted, or not loaded yet.
      return const Scaffold(appBar: MmAppBar(title: 'Workout'));
    }
    final today = ref.watch(todayProvider);
    final controller = ref.read(workoutControllerProvider);
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: MmAppBar(
        title: workout.inProgress
            ? 'Workout'
            : 'Workout, ${Fmt.day(workout.date, today)}',
        actions: [
          MmIconButton(
            key: const ValueKey('workout-delete'),
            icon: Icons.delete_outline,
            tooltip: 'Delete workout',
            onPressed: () async {
              final sure = await showMmConfirm(
                context,
                title: 'Delete this workout?',
                message: 'Its exercises and sets are deleted with it.',
                confirmLabel: 'Delete',
              );
              if (!sure || !context.mounted) return;
              Navigator.of(context).pop();
              await controller.delete(workout);
            },
          ),
        ],
      ),
      bottomNavigationBar: workout.inProgress
          ? SetTimerBar(workout: workout)
          : null,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Text(
            workoutSummaryText(workout),
            key: const ValueKey('workout-summary'),
            style: text.bodyMedium?.copyWith(color: context.mm.text2),
          ),
          const SizedBox(height: 12),
          WorkoutClockCard(workout: workout),
          const SizedBox(height: 12),
          if (workout.exercises.isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                'Add the first exercise. Each set is one tap once the first '
                'is in.',
                style: text.bodyLarge,
              ),
            ),
          for (var i = 0; i < workout.exercises.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: WorkoutExerciseCard(workout: workout, index: i),
            ),
          MmButton(
            key: const ValueKey('workout-add-exercise'),
            label: 'Add exercise',
            icon: Icons.add,
            kind: MmButtonKind.secondary,
            expand: true,
            onPressed: () async {
              final exerciseId = await Navigator.of(context).push(
                MaterialPageRoute<String>(
                  builder: (_) => const ExercisePickerScreen(),
                ),
              );
              if (exerciseId != null) {
                await controller.addExercise(workout, exerciseId);
              }
            },
          ),
          if (workout.inProgress) ...[
            const SizedBox(height: 12),
            MmButton(
              key: const ValueKey('workout-finish'),
              label: 'Finish workout',
              expand: true,
              // Nothing to keep until a set with reps is logged; an empty
              // workout is deleted from the top bar.
              onPressed: !_hasWork(workout)
                  ? null
                  : () async {
                      await controller.finish(workout);
                      if (context.mounted) Navigator.of(context).pop();
                    },
            ),
          ],
        ],
      ),
    );
  }
}
