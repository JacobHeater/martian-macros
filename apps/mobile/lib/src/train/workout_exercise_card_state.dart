import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/elapsed_text.dart';
import '../format/fmt.dart';
import '../format/set_text.dart';
import '../integration_providers.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_icon_button.dart';
import '../ui/mm_list_row.dart';
import '../ui/show_mm_confirm.dart';
import 'set_editor.dart';
import 'workout_controller_provider.dart';
import 'workout_exercise_card.dart';

class WorkoutExerciseCardState extends ConsumerState<WorkoutExerciseCard> {
  /// The set whose controls are showing, if any. A set just added is.
  int? _open;

  @override
  Widget build(BuildContext context) {
    final workout = widget.workout;
    final index = widget.index;
    final entry = workout.exercises[index];
    final exercise = ref.watch(exercisesByIdProvider)[entry.exerciseId];
    final load = exercise?.load ?? ExerciseLoad.addedWeight;
    final fmt = Fmt(
      ref.watch(setupProvider).value?.unitSystem ?? UnitSystem.imperial,
    );
    final lastTime = previousSetsOf(
      exerciseId: entry.exerciseId,
      workouts: ref.watch(workoutsProvider).value ?? const [],
      before: workout.startedAt,
    );
    final controller = ref.read(workoutControllerProvider);
    final text = Theme.of(context).textTheme;

    return InfoCard(
      key: ValueKey('exercise-$index'),
      // An exercise of the user's own that has since been deleted.
      title: exercise?.name ?? 'Deleted exercise',
      trailing: MmIconButton(
        key: ValueKey('remove-exercise-$index'),
        icon: Icons.close,
        tooltip: 'Remove exercise',
        onPressed: () async {
          final sure =
              entry.sets.isEmpty ||
              await showMmConfirm(
                context,
                title: 'Remove this exercise?',
                message: 'Its sets in this workout are removed with it.',
                confirmLabel: 'Remove',
              );
          if (!sure) return;
          setState(() => _open = null);
          await controller.removeExercise(workout, index);
        },
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (lastTime.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                'Last time: '
                '${[for (final s in lastTime) setText(s, fmt, load)].join(', ')}',
                key: ValueKey('last-time-$index'),
                style: text.bodySmall?.copyWith(color: context.mm.text2),
              ),
            ),
          for (var s = 0; s < entry.sets.length; s++)
            if (s == _open)
              SetEditor(
                key: ValueKey('set-editor-$index-$s'),
                set: entry.sets[s],
                number: s + 1,
                timeBase: workout.startedAt,
                checkTimes: (start, end) => checkSetTimes(
                  start: start,
                  end: end,
                  notBefore: workout.startedAt,
                  notAfter: workout.endedAt ?? ref.read(clockProvider).now(),
                  otherSets: [
                    for (var e = 0; e < workout.exercises.length; e++)
                      for (var t = 0; t < workout.exercises[e].sets.length; t++)
                        if (e != index || t != s) workout.exercises[e].sets[t],
                  ],
                ),
                load: load,
                fmt: fmt,
                keyPrefix: 'set-$index-$s',
                onChanged: (set) =>
                    controller.updateSet(workout, index, s, set),
                onRemove: () {
                  setState(() => _open = null);
                  controller.removeSet(workout, index, s);
                },
              )
            else
              MmListRow(
                key: ValueKey('set-$index-$s'),
                dense: true,
                title: setText(entry.sets[s], fmt, load),
                // How long the set took, when it was timed.
                trailing: Text(
                  entry.sets[s].duration == null
                      ? 'Set ${s + 1}'
                      : 'Set ${s + 1} \u00b7 '
                            '${elapsedText(entry.sets[s].duration!)}',
                  style: text.bodySmall,
                ),
                onTap: () => setState(() => _open = s),
              ),
          const SizedBox(height: 8),
          MmButton(
            key: ValueKey('add-set-$index'),
            label: 'Add set',
            icon: Icons.add,
            kind: MmButtonKind.secondary,
            expand: true,
            onPressed: () {
              // The next set is ready to adjust: its controls are open.
              setState(() => _open = entry.sets.length);
              controller.addSet(workout, index, lastTime: lastTime.firstOrNull);
            },
          ),
        ],
      ),
    );
  }
}
