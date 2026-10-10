import 'equipment.dart';
import 'exercise_load.dart';
import 'health_connect_segment.dart';
import 'muscle_group.dart';

/// Something sets are logged against (MM-76): one of the built-in exercises,
/// or one the user added.
final class Exercise {
  const Exercise({
    required this.id,
    required this.name,
    required this.equipment,
    required this.primary,
    this.secondary = const [],
    this.load = ExerciseLoad.addedWeight,
    this.healthConnect,
  });

  /// Permanent. Logged sets refer to it, so it outlives a change of name.
  /// Empty for one of the user's own that is not yet saved.
  final String id;
  final String name;
  final Equipment equipment;

  /// The muscle group a set counts fully toward (MM-78).
  final MuscleGroup primary;

  /// The muscle groups a set counts half toward (MM-78).
  final List<MuscleGroup> secondary;
  final ExerciseLoad load;

  /// What Health Connect calls this movement, if it names it (MM-189). Null is
  /// a normal state: the exercise stays in the app and is left out of what a
  /// platform is told, never written as a different one.
  final HealthConnectSegment? healthConnect;

  /// What the id of every exercise the user added starts with. No built-in
  /// exercise's id does.
  static const customIdPrefix = 'custom-';

  /// Whether the user added this exercise.
  bool get isCustom => id.isEmpty || id.startsWith(customIdPrefix);

  Exercise withId(String id) => Exercise(
    id: id,
    name: name,
    equipment: equipment,
    primary: primary,
    secondary: secondary,
    load: load,
    healthConnect: healthConnect,
  );
}
