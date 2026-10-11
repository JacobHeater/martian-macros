import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../providers.dart';

final weeklyVolumeProvider = Provider<AsyncValue<WeeklyVolume>>((ref) {
  final workouts = ref.watch(workoutsProvider);
  final custom = ref.watch(customExercisesProvider);
  for (final state in [workouts, custom]) {
    if (state.hasError) return AsyncError(state.error!, state.stackTrace!);
  }
  if (workouts.isLoading || custom.isLoading) return const AsyncLoading();
  final exercises = ref.watch(exercisesProvider);
  final today = ref.watch(todayProvider);
  try {
    return AsyncData(
      buildWeeklyVolume(
        workouts: workouts.requireValue,
        exercises: exercises,
        today: today,
      ),
    );
  } on ArgumentError catch (error, stack) {
    return AsyncError(error, stack);
  }
});
