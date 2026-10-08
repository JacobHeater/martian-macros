import 'package:mm_engine/mm_engine.dart';

/// One sentence on what would change the targets next (MM-138).
String whatWouldChangeIt(TargetsExplanation e) {
  bool has(ExplanationReason r) => e.lines.any((l) => l.reason == r);
  if (e.estimateStatus == TdeeStatus.held) {
    return 'More fully logged days and regular weigh-ins would let the app '
        'measure your expenditure.';
  }
  if (has(ExplanationReason.calorieFloor)) {
    return 'The floor stays until your resting energy or body-fat estimate '
        'changes.';
  }
  if (has(ExplanationReason.stepLimit)) {
    return 'The rest of the change arrives over the next weeks, in weekly '
        'steps.';
  }
  if (e.excludedPartialDays > 0) {
    return 'More complete days would make this estimate firmer.';
  }
  return 'If your weight trend changes at this intake, expect targets to '
      'follow.';
}
