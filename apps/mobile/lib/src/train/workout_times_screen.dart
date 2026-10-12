import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/clock_time_text.dart';
import '../format/fmt.dart';
import '../format/time_span_problem_text.dart';
import '../integration_providers.dart';
import '../providers.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_list_group.dart';
import '../ui/mm_list_row.dart';
import '../ui/show_mm_snack_bar.dart';
import '../ui/show_mm_time_picker.dart';
import 'workout_controller_provider.dart';

/// Setting a workout's day, start and end by hand (MM-191): for one logged
/// afterwards, or whose clock was left running.
class WorkoutTimesScreen extends ConsumerWidget {
  const WorkoutTimesScreen({required this.workoutId, super.key});

  final int workoutId;

  static DateTime _on(CalendarDate date, DateTime time, {int addDays = 0}) =>
      DateTime(
        date.year,
        date.month,
        date.day + addDays,
        time.hour,
        time.minute,
        time.second,
      );

  /// How many days after its start a workout ended: 1 for one that ran
  /// past midnight.
  static int _daysOn(DateTime start, DateTime end) =>
      CalendarDate.fromDateTime(end).epochDay -
      CalendarDate.fromDateTime(start).epochDay;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workouts = ref.watch(workoutsProvider).value ?? const <Workout>[];
    final workout = workouts.where((w) => w.id == workoutId).firstOrNull;
    if (workout == null) {
      return const Scaffold(appBar: MmAppBar(title: 'Workout times'));
    }
    final today = ref.watch(todayProvider);
    final controller = ref.read(workoutControllerProvider);
    final ended = workout.endedAt;

    /// Keeps the change if it makes sense; says why not otherwise.
    Future<void> change({
      CalendarDate? date,
      DateTime? startedAt,
      DateTime? endedAt,
    }) async {
      final start = startedAt ?? workout.startedAt;
      final end = endedAt ?? workout.endedAt;
      final problem = checkTimeSpan(
        start: start,
        end: end,
        notAfter: ref.read(clockProvider).now(),
      );
      if (problem != null) {
        showMmSnackBar(
          ScaffoldMessenger.of(context),
          problem == TimeSpanProblem.tooLate
              ? 'A workout cannot be in the future.'
              : problem.message,
        );
        return;
      }
      await controller.setTimes(
        workout,
        date: date ?? workout.date,
        startedAt: start,
        endedAt: end,
      );
    }

    Future<DateTime?> pickTime(DateTime current, String help) async {
      final minutes = await showMmTimePicker(
        context,
        initialMinuteOfDay: current.hour * 60 + current.minute,
        helpText: help,
      );
      if (minutes == null) return null;
      return DateTime(
        current.year,
        current.month,
        current.day,
      ).add(Duration(minutes: minutes));
    }

    return Scaffold(
      appBar: const MmAppBar(title: 'Workout times'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          MmListGroup(
            children: [
              MmListRow(
                key: const ValueKey('workout-time-date'),
                title: 'Day',
                subtitle: Fmt.day(workout.date, today),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime(
                      workout.date.year,
                      workout.date.month,
                      workout.date.day,
                    ),
                    firstDate: DateTime(today.year - 5),
                    lastDate: DateTime(today.year, today.month, today.day),
                    helpText: 'Day of the workout',
                  );
                  if (picked == null) return;
                  // The times of day stay; the day they are on moves.
                  final date = CalendarDate.fromDateTime(picked);
                  await change(
                    date: date,
                    startedAt: _on(date, workout.startedAt),
                    // An end after midnight stays on the day after.
                    endedAt: ended == null
                        ? null
                        : _on(
                            date,
                            ended,
                            addDays: _daysOn(workout.startedAt, ended),
                          ),
                  );
                },
              ),
              MmListRow(
                key: const ValueKey('workout-time-start'),
                title: 'Started',
                subtitle: clockTimeText(workout.startedAt),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  final picked = await pickTime(workout.startedAt, 'Started');
                  if (picked != null) await change(startedAt: picked);
                },
              ),
              if (ended != null)
                MmListRow(
                  key: const ValueKey('workout-time-end'),
                  title: 'Ended',
                  subtitle: _daysOn(workout.startedAt, ended) > 0
                      ? '${clockTimeText(ended)}, next day'
                      : clockTimeText(ended),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    final picked = await pickTime(ended, 'Ended');
                    if (picked == null) return;
                    // A time of day before the start is after midnight,
                    // on the next day, when that is not still to come.
                    await change(
                      endedAt: placeTimeOfDay(
                        notBefore: workout.startedAt,
                        notAfter: ref.read(clockProvider).now(),
                        timeOfDay: Duration(
                          hours: picked.hour,
                          minutes: picked.minute,
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
          if (workout.inProgress) ...[
            const SizedBox(height: 16),
            MmButton(
              key: const ValueKey('workout-restart-clock'),
              label: 'Start the clock again from now',
              kind: MmButtonKind.secondary,
              expand: true,
              onPressed: () => controller.restartClock(workout),
            ),
          ],
        ],
      ),
    );
  }
}
