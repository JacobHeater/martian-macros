import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'exercise_picker_screen_state.dart';

/// Choosing an exercise for a workout (MM-76): recently used ones first, then
/// search over the built-in library and the user's own. Pops with the chosen
/// exercise's id.
class ExercisePickerScreen extends ConsumerStatefulWidget {
  const ExercisePickerScreen({super.key});

  @override
  ConsumerState<ExercisePickerScreen> createState() =>
      ExercisePickerScreenState();
}
