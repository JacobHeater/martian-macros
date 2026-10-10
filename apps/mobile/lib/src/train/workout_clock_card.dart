import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/clock_time_text.dart';
import '../format/elapsed_text.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_surface.dart';
import 'ticking.dart';
import 'workout_controller_provider.dart';
import 'workout_times_screen.dart';

/// How long a workout has run, or ran (MM-191): a clock that runs while it
/// is in progress and can be paused, its start, end and length once
/// finished, and the way to change them. Time paused is left out.
class WorkoutClockCard extends ConsumerWidget {
  const WorkoutClockCard({required this.workout, super.key});

  final Workout workout;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final quiet = text.bodyMedium?.copyWith(color: context.mm.text2);
    final controller = ref.read(workoutControllerProvider);
    final ended = workout.endedAt;

    Widget time(DateTime now) => Text(
      elapsedText(workout.activeFor(now)),
      key: const ValueKey('workout-elapsed'),
      style: text.headlineMedium,
    );

    return MmSurface(
      key: const ValueKey('workout-clock'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: ended == null
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Ticking(builder: (context, now) => time(now)),
                          Text(
                            workout.paused
                                ? 'Paused'
                                : 'Started '
                                      '${clockTimeText(workout.startedAt)}',
                            key: const ValueKey('workout-clock-state'),
                            style: quiet,
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          time(ended),
                          Text(
                            '${clockTimeText(workout.startedAt)} to '
                            '${clockTimeText(ended)}',
                            key: const ValueKey('workout-span'),
                            style: quiet,
                          ),
                          if (workout.pausedFor > Duration.zero)
                            Text(
                              'Paused for ${elapsedText(workout.pausedFor)}',
                              key: const ValueKey('workout-paused-for'),
                              style: quiet,
                            ),
                        ],
                      ),
              ),
              if (ended == null)
                MmButton(
                  key: const ValueKey('workout-pause'),
                  label: workout.paused ? 'Resume' : 'Pause',
                  icon: workout.paused ? Icons.play_arrow : Icons.pause,
                  kind: workout.paused
                      ? MmButtonKind.primary
                      : MmButtonKind.secondary,
                  onPressed: () => workout.paused
                      ? controller.resume(workout)
                      : controller.pause(workout),
                ),
            ],
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: MmButton(
              key: const ValueKey('workout-edit-times'),
              label: 'Edit times',
              kind: MmButtonKind.text,
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => WorkoutTimesScreen(workoutId: workout.id),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
