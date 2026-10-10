import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../integration_providers.dart';
import '../repository_role_providers.dart';
import 'workout_controller.dart';

final workoutControllerProvider = Provider<WorkoutController>(
  (ref) => WorkoutController(
    workouts: ref.watch(workoutWriterProvider),
    clock: ref.watch(clockProvider),
  ),
);
