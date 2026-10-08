import 'package:mm_engine/mm_engine.dart';

extension ModeReasonExplanation on ModeReason {
  String get explanation => switch (this) {
    ModeReason.deficitNotAllowed =>
      'Based on your health check, the app will not prescribe a calorie '
          'deficit.',
    ModeReason.highBodyFat =>
      'At your current body fat, steady fat loss gives the fastest visible '
          'progress while training protects your muscle.',
    ModeReason.recompEligible =>
      'With your training background and body composition, you can '
          'realistically lose fat and gain muscle at the same time.',
    ModeReason.leanAndTrained =>
      'You are already lean and trained, so building muscle needs a small '
          'surplus.',
    ModeReason.cutFirst =>
      'For trained lifters at moderate body fat, a focused cut works '
          'better than trying to do both at once.',
  };
}
