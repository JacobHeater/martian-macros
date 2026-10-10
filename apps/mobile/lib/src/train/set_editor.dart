import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import 'set_editor_state.dart';

/// The controls for one set (MM-75): reps and load, each typed or stepped
/// with large buttons, and reps in reserve. Every change is reported at once.
///
/// Its controls are keyed `<keyPrefix>-reps`, `-reps-minus`, `-reps-plus`,
/// `-load`, `-load-minus`, `-load-plus`, `-rir`, `-start`, `-end` and
/// `-remove`.
class SetEditor extends StatefulWidget {
  const SetEditor({
    required this.set,
    required this.number,
    required this.load,
    required this.fmt,
    required this.keyPrefix,
    required this.onChanged,
    required this.timeBase,
    required this.checkTimes,
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

  /// The day a typed time of day is on, and where the picker opens when
  /// the set has no time yet (MM-191).
  final DateTime timeBase;

  /// What is wrong with a typed start and end, if anything. A time that
  /// fails is refused and the set keeps what it had.
  final TimeSpanProblem? Function(DateTime? start, DateTime? end) checkTimes;
  final VoidCallback onRemove;

  @override
  State<SetEditor> createState() => SetEditorState();
}
