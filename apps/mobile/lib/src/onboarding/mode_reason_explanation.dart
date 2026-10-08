import 'package:mm_engine/mm_engine.dart';

/// Added to every reason that rests on body fat, which the app only
/// estimates (MM-132).
const _estimateNote =
    'Body fat here is an estimate that can be off by a few points either way.';

extension ModeReasonExplanation on ModeReason {
  String get explanation => switch (this) {
    ModeReason.deficitNotAllowed =>
      'Based on your health check, the app will not prescribe a calorie '
          'deficit.',
    ModeReason.underweight =>
      'Your weight is below the range where the app will plan a calorie '
          'deficit, so it starts you at maintenance. If you are not eating '
          'enough, talk to a clinician.',
    ModeReason.highBodyFat =>
      'At your estimated body fat, steady fat loss gives the fastest visible '
          'progress while training protects your muscle. $_estimateNote',
    ModeReason.recompEligible =>
      'With your training background and estimated body fat, you can '
          'realistically lose fat and gain muscle at the same time. '
          '$_estimateNote',
    ModeReason.leanAndTrained =>
      'You are already lean and trained, so building muscle needs a small '
          'surplus. $_estimateNote',
    ModeReason.cutFirst =>
      'For trained lifters at moderate body fat, a focused cut works '
          'better than trying to do both at once. $_estimateNote',
  };
}
