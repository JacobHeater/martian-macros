import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'custom_exercise_screen_state.dart';

/// Adding an exercise of the user's own (MM-76), with the same fields as a
/// built-in one. Pops with the new exercise's id.
class CustomExerciseScreen extends ConsumerStatefulWidget {
  const CustomExerciseScreen({this.name = '', super.key});

  /// What was typed in the search, as a start for the name.
  final String name;

  @override
  ConsumerState<CustomExerciseScreen> createState() =>
      CustomExerciseScreenState();
}
