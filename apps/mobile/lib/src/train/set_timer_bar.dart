import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/elapsed_text.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import 'ticking.dart';
import 'workout_controller_provider.dart';

/// The set and rest timer of a workout in progress (MM-191), always in reach
/// at the bottom of the screen. "Start set" starts timing a set; adding the
/// set stops it and gives the set its start and end. From then the rest is
/// counted, until the next set is started.
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
    final label = setStarted != null
        ? 'Set'
        : restStarted != null
        ? 'Rest'
        : 'Set timer';

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
                    Text(
                      label,
                      key: const ValueKey('set-timer-label'),
                      style: text.bodySmall?.copyWith(color: colors.text2),
                    ),
                    Ticking(
                      builder: (context, now) => Text(
                        since == null
                            ? elapsedText(Duration.zero)
                            : elapsedText(now.difference(since)),
                        key: const ValueKey('set-timer-time'),
                        style: text.headlineSmall,
                      ),
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
                onPressed: () => setStarted == null
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
