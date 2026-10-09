import 'package:mm_engine/mm_engine.dart';

String confidenceLabel(ConfidenceLevel level) => switch (level) {
  ConfidenceLevel.learning => 'Learning',
  ConfidenceLevel.fair => 'Fair',
  ConfidenceLevel.good => 'Good',
};

String confidenceNextStepText(
  CoachConfidence confidence,
) => switch (confidence.nextStep) {
  ConfidenceNextStep.completeFoodLog =>
    confidence.usableFoodDays < confidenceMinimumFoodDays
        ? 'Log food and mark days complete when they are. '
              'You need ${confidenceMinimumFoodDays - confidence.usableFoodDays} more usable '
              'day${confidence.usableFoodDays == confidenceMinimumFoodDays - 1 ? '' : 's'} to reach '
              'the minimum.'
        : 'Mark days complete when they are. '
              '${confidenceGoodFoodDays - confidence.usableFoodDays} more '
              'usable days would make the estimate firmer.',
  ConfidenceNextStep.recordWeight =>
    'Weigh in on ${confidence.weighInDays < confidenceMinimumWeighInDays ? confidenceMinimumWeighInDays - confidence.weighInDays : confidenceGoodWeighInDays - confidence.weighInDays} '
        'more mornings to make the estimate clearer.',
  ConfidenceNextStep.waitForStability =>
    'Nothing to do: the estimate is settling after a recent change.',
  ConfidenceNextStep.reviewFoodLogging =>
    'Your food log may be missing items. Review it for anything not '
        'recorded.',
  ConfidenceNextStep.keepLogging =>
    'Keep logging food and weight consistently; that will make the '
        'estimate firmer.',
};
