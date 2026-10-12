import 'fmt.dart';
import 'load_number.dart';

/// The rep range and load step suggestions are made with, in a line
/// (MM-79): "6 to 10 reps · 5 lb steps".
String progressionSettingsText({
  required int repsLow,
  required int repsHigh,
  required double loadStepKg,
  required Fmt fmt,
}) =>
    '$repsLow to $repsHigh reps · '
    '${loadNumber(fmt.weightFromKg(loadStepKg))} ${fmt.weightUnit} steps';
