import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';
import 'load_number.dart';

/// A suggestion for the next session and its reason, in one or two short
/// sentences (MM-79): "One more rep on any set would be a step up." It is
/// read under what was done last time, so it does not repeat it, and it
/// offers; it does not tell the user what to do.
String progressionText(
  ProgressionSuggestion suggestion,
  Fmt fmt,
  ExerciseLoad load,
) {
  String? loadText(double kg) {
    final amount =
        '${loadNumber(fmt.weightFromKg(kg).abs())} ${fmt.weightUnit}';
    if (load == ExerciseLoad.addedWeight) return amount;
    if (kg.abs() < 0.05) return null;
    return kg > 0 ? '+$amount' : '$amount assisted';
  }

  String work(double kg, String reps) {
    final at = loadText(kg);
    return at == null ? '$reps reps' : '$at × $reps';
  }

  final next = work(suggestion.loadKg, '${suggestion.reps}');
  return switch (suggestion.kind) {
    ProgressionKind.addReps => 'One more rep on any set would be a step up.',
    ProgressionKind.addLoad =>
      'Every set reached ${suggestion.rangeTop} last time. '
          'A step up would be $next.',
    ProgressionKind.hold =>
      'No more reps at this load in three sessions. '
          'Holding $next is a fair aim.',
    ProgressionKind.match =>
      'Matching last time holds your strength while you lose fat.',
  };
}
