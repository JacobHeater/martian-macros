import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/elapsed_text.dart';
import '../format/spoken_duration.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import 'ticking.dart';
import 'workout_controller_provider.dart';

/// The set and rest timer of a workout in progress (MM-191), always in reach
/// at the bottom of the screen. "Start set" starts timing a set; adding the
/// set stops it and gives the set its start and end. From then the rest is
/// counted, until the next set is started: up, or down to the target rest
/// of the exercise just done, and up again once that is reached.
class SetTimerBar extends ConsumerWidget {
  const SetTimerBar({required this.workout, super.key});

  final Workout workout;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(workoutControllerProvider);
    final text = Theme.of(context).textTheme;
    final colors = context.mm;
    final setStarted = workout.setStartedAt;
    final restStarted = restStartedAt(workout);
    final since = setStarted ?? restStarted;
    final target = setStarted == null ? restTargetOf(workout) : null;

    return Material(
      color: colors.raised,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Ticking(
                      builder: (context, now) {
                        final counting = since != null && !workout.paused;
                        final elapsed = counting
                            ? now.difference(since)
                            : Duration.zero;
                        final left = counting && target != null
                            ? target - elapsed
                            : null;
                        final down = left != null && left > Duration.zero;
                        final shown = down ? left : elapsed;
                        final aim = target == null
                            ? ''
                            : ' · ${elapsedText(target)} target';
                        final label = workout.paused
                            ? 'Paused'
                            : setStarted != null
                            ? 'Set'
                            : restStarted == null
                            ? 'Set timer'
                            : left == null
                            ? 'Rest'
                            : down
                            ? 'Rest left$aim'
                            : 'Target rest reached$aim';
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Said once when it changes; the figure under
                            // it changes every second and is read only
                            // when asked for.
                            Semantics(
                              liveRegion: true,
                              child: Text(
                                label,
                                key: const ValueKey('set-timer-label'),
                                style: text.bodySmall?.copyWith(
                                  color: colors.text2,
                                ),
                              ),
                            ),
                            Text(
                              elapsedText(shown),
                              key: const ValueKey('set-timer-time'),
                              semanticsLabel: down
                                  ? '${spokenDuration(shown)} left'
                                  : spokenDuration(shown),
                              style: text.headlineSmall,
                            ),
                          ],
                        );
                      },
                    ),
                    if (setStarted != null)
                      Text(
                        'Tap Add set when the set is done.',
                        style: text.bodySmall?.copyWith(color: colors.text2),
                      ),
                  ],
                ),
              ),
              MmButton(
                key: const ValueKey('set-timer-button'),
                label: setStarted == null ? 'Start set' : 'Cancel',
                kind: setStarted == null
                    ? MmButtonKind.primary
                    : MmButtonKind.secondary,
                // Nothing is timed while the workout is paused.
                onPressed: workout.paused
                    ? null
                    : () => setStarted == null
                          ? controller.startSet(workout)
                          : controller.cancelSet(workout),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
