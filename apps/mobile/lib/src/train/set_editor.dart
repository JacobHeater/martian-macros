import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import 'set_editor_state.dart';

/// The controls for one set (MM-75): reps and load, each typed or stepped
/// with large buttons, and reps in reserve. Every change is reported at once.
///
/// Its controls are keyed `<keyPrefix>-reps`, `-reps-minus`, `-reps-plus`,
/// `-load`, `-load-minus`, `-load-plus`, `-rir` and `-remove`.
class SetEditor extends StatefulWidget {
  const SetEditor({
    required this.set,
    required this.number,
    required this.load,
    required this.fmt,
    required this.keyPrefix,
    required this.onChanged,
    required this.onRemove,
    super.key,
  });

  final WorkoutSet set;

  /// Which set of the exercise this is, from 1.
  final int number;
  final ExerciseLoad load;
  final Fmt fmt;
  final String keyPrefix;
  final ValueChanged<WorkoutSet> onChanged;
  final VoidCallback onRemove;

  @override
  State<SetEditor> createState() => SetEditorState();
}
