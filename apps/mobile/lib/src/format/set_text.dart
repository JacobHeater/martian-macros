import 'package:mm_domain/mm_domain.dart';

import 'fmt.dart';
import 'load_number.dart';

/// One set in words (MM-75): "8 × 225 lb", and for a bodyweight exercise
/// "8 reps", "8 × +25 lb" or "8 × 20 lb assisted". Reps in reserve
/// follow when recorded: "8 × 225 lb · 2 RIR".
String setText(WorkoutSet set, Fmt fmt, ExerciseLoad load) {
  final amount = loadNumber(fmt.weightFromKg(set.loadKg).abs());
  final unit = fmt.weightUnit;
  final reps = set.reps == 1 ? '1 rep' : '${set.reps} reps';
  final work = switch (load) {
    ExerciseLoad.addedWeight => '${set.reps} × $amount $unit',
    ExerciseLoad.bodyweight when set.loadKg == 0 => reps,
    ExerciseLoad.bodyweight when set.loadKg > 0 =>
      '${set.reps} × +$amount $unit',
    ExerciseLoad.bodyweight => '${set.reps} × $amount $unit assisted',
  };
  final rir = set.rir;
  if (rir == null) return work;
  return '$work · ${rirText(rir)} RIR';
}

/// Reps in reserve as shown: 0 to 4, then "5+".
String rirText(int rir) => rir >= WorkoutSet.maxRir ? '5+' : '$rir';
