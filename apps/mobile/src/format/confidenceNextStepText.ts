import {
  type CoachConfidence,
  confidenceGoodFoodDays,
  confidenceGoodWeighInDays,
  confidenceMinimumFoodDays,
  confidenceMinimumWeighInDays,
} from '../engine';

export function confidenceNextStepText(confidence: CoachConfidence): string {
  switch (confidence.nextStep) {
    case 'completeFoodLog':
      return confidence.usableFoodDays < confidenceMinimumFoodDays
        ? 'Log food and mark days complete when they are. ' +
            `You need ${confidenceMinimumFoodDays - confidence.usableFoodDays} more usable ` +
            `day${confidence.usableFoodDays === confidenceMinimumFoodDays - 1 ? '' : 's'} to reach ` +
            'the minimum.'
        : 'Mark days complete when they are. ' +
            `${confidenceGoodFoodDays - confidence.usableFoodDays} more ` +
            'usable days would make the estimate firmer.';
    case 'recordWeight':
      return (
        `Weigh in on ${
          confidence.weighInDays < confidenceMinimumWeighInDays
            ? confidenceMinimumWeighInDays - confidence.weighInDays
            : confidenceGoodWeighInDays - confidence.weighInDays
        } ` + 'more mornings to make the estimate clearer.'
      );
    case 'waitForStability':
      return 'Nothing to do: the estimate is settling after a recent change.';
    case 'reviewFoodLogging':
      return 'Your food log may be missing items. Review it for anything not recorded.';
    case 'keepLogging':
      return 'Keep logging food and weight consistently; that will make the estimate firmer.';
  }
}
