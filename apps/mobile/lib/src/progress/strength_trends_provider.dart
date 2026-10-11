import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../providers.dart';

final strengthTrendsProvider = Provider<AsyncValue<List<StrengthTrend>>>((ref) {
  final workouts = ref.watch(workoutsProvider);
  final weights = ref.watch(weightsProvider);
  final custom = ref.watch(customExercisesProvider);
  for (final state in [workouts, weights, custom]) {
    if (state.hasError) return AsyncError(state.error!, state.stackTrace!);
  }
  if (workouts.isLoading || weights.isLoading || custom.isLoading) {
    return const AsyncLoading();
  }
  final exercises = ref.watch(exercisesProvider);
  final today = ref.watch(todayProvider);
  try {
    return AsyncData(
      buildStrengthTrends(
        workouts: workouts.requireValue,
        weights: weights.requireValue,
        exercises: exercises,
        today: today,
      ),
    );
  } on ArgumentError catch (error, stack) {
    return AsyncError(error, stack);
  }
});
