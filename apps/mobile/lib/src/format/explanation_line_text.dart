import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';

/// The words for one contribution to a change in targets (MM-138). They name
/// the cause and its size, and never a day's eating: the engine estimates
/// expenditure, it does not react to intake.
extension ExplanationLineText on ExplanationLine {
  String get text {
    final size = _signed(kcal);
    return switch (reason) {
      ExplanationReason.firstTargets =>
        'Your first targets, from your starting estimate of expenditure.',
      ExplanationReason.expenditureEstimate =>
        'Your expenditure is ${Fmt.kcal(to!)} a day, '
            '${kcal < 0 ? 'down' : 'up'} from ${Fmt.whole(from!)} ($size).',
      ExplanationReason.paceAndWeight =>
        'Your pace and body weight moved the target ($size).',
      ExplanationReason.goalChange => 'You changed your goal ($size).',
      ExplanationReason.appRuleUpdate =>
        'The target rules changed in an app update ($size).',
      ExplanationReason.profileCorrection =>
        'You corrected your profile or health check ($size).',
      ExplanationReason.healthRule =>
        'Your health check rules out your goal, so targets are at '
            'maintenance ($size).',
      ExplanationReason.underweightRule =>
        'Your weight is below the range where the app plans a calorie '
            'deficit, so targets are at maintenance ($size).',
      ExplanationReason.bodyFatEstimate =>
        'Your body-fat estimate moved a safety limit ($size).',
      ExplanationReason.dietBreak =>
        'A maintenance break after a long deficit ($size).',
      ExplanationReason.stepLimit =>
        'Weekly changes are limited, so ${Fmt.whole(kcal.abs())} kcal of the '
            '${kcal > 0 ? 'decrease' : 'increase'} is held for next week.',
      ExplanationReason.holdAfterRaise =>
        'Held at last week’s level after a raise ($size).',
      ExplanationReason.safetyRaise =>
        'You were losing faster than the app aims for at your body fat, so '
            'targets went up ($size).',
      ExplanationReason.userHold =>
        'You kept last week’s targets for now ($size).',
      ExplanationReason.calorieFloor =>
        'Your calorie floor is ${Fmt.kcal(to!)}; the target would otherwise '
            'be ${Fmt.kcal(from!)}.',
      ExplanationReason.noExplanationRecorded =>
        'No explanation was recorded for these targets.',
      ExplanationReason.requestedBreak =>
        'A maintenance week you chose to take ($size).',
    };
  }

  static String _signed(double value) {
    final sign = value > 0 ? '+' : (value < 0 ? '−' : '');
    return '$sign${Fmt.whole(value.abs())}';
  }
}
