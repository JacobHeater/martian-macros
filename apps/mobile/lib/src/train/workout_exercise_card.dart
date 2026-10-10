import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'workout_exercise_card_state.dart';

/// One exercise of a workout (MM-75): what was done last time, its sets, and
/// a button that adds the next set as a copy of the one before.
///
/// Its controls are keyed by [index]: `exercise-<index>`, `last-time-<index>`,
/// `add-set-<index>`, `remove-exercise-<index>`, and for each set
/// `set-<index>-<set>`.
class WorkoutExerciseCard extends ConsumerStatefulWidget {
  const WorkoutExerciseCard({
    required this.workout,
    required this.index,
    super.key,
  });

  final Workout workout;

  /// The exercise's place in [workout].
  final int index;

  @override
  ConsumerState<WorkoutExerciseCard> createState() =>
      WorkoutExerciseCardState();
}
