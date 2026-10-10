import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/clock_time_text.dart';
import '../format/elapsed_text.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_surface.dart';
import 'ticking.dart';
import 'workout_times_screen.dart';

/// How long a workout has run, or ran (MM-191): a running clock while it is
/// in progress, its start, end and length once finished, and the way to
/// change them.
class WorkoutClockCard extends StatelessWidget {
  const WorkoutClockCard({required this.workout, super.key});

  final Workout workout;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final quiet = text.bodyMedium?.copyWith(color: context.mm.text2);
    final ended = workout.endedAt;
    return MmSurface(
      key: const ValueKey('workout-clock'),
      child: Row(
        children: [
          Expanded(
            child: ended == null
                ? Ticking(
                    builder: (context, now) => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          elapsedText(now.difference(workout.startedAt)),
                          key: const ValueKey('workout-elapsed'),
                          style: text.headlineMedium,
                        ),
                        Text(
                          'Started ${clockTimeText(workout.startedAt)}',
                          style: quiet,
                        ),
                      ],
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        elapsedText(ended.difference(workout.startedAt)),
                        key: const ValueKey('workout-elapsed'),
                        style: text.headlineMedium,
                      ),
                      Text(
                        '${clockTimeText(workout.startedAt)} to '
                        '${clockTimeText(ended)}',
                        key: const ValueKey('workout-span'),
                        style: quiet,
                      ),
                    ],
                  ),
          ),
          MmButton(
            key: const ValueKey('workout-edit-times'),
            label: 'Edit times',
            kind: MmButtonKind.text,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => WorkoutTimesScreen(workoutId: workout.id),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
