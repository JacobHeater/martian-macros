import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';

/// What the coach says about a stall (MM-140): the body, then any options.
///
/// Arithmetic, not accusation. It states averages and what they predict, and
/// offers options, never instructions. The chance that the log understates
/// what was eaten is raised once, only when the estimate is very low.
(String body, List<String> options) stallText(StallAssessment a, Fmt fmt) {
  final intake = a.averageIntakeKcal;
  final target = a.averageTargetKcal;
  switch (a.diagnosis!) {
    case StallDiagnosis.data:
      return (
        'The log is too thin to tell why. The last ${a.windowDays} days have '
            '${a.usableFoodDays} fully logged days and ${a.weighIns} '
            'weigh-ins. With ${StallRule.minimumFoodDays} logged days and '
            '${StallRule.minimumWeighIns} weigh-ins the coach can say what is '
            'happening.',
        const [],
      );
    case StallDiagnosis.masked:
      final waist = a.waistChangeCm;
      if (!a.maskedByEvent && waist != null) {
        final down =
            '${fmt.lengthFromCm(waist.abs()).toStringAsFixed(1)} '
            '${fmt.lengthUnit}';
        return (
          'Your waist is down $down while the scale held. That is usually fat '
              'loss hidden by water. Nothing to change.',
          const [],
        );
      }
      return (
        'Something you noted in the last ${StallRule.maskingEventDays} days '
            'can hold water on the scale for a while. The scale usually '
            'catches up. Nothing to change.',
        const [],
      );
    case StallDiagnosis.intake:
      final figures =
          'Your average has been about ${Fmt.whole(intake!)} against a target '
          'of ${Fmt.whole(target!)}. At ${Fmt.whole(intake)} the app would '
          'expect roughly the pace you are seeing.';
      return (
        figures,
        a.gaining
            ? const ['Keep the target', 'Move to a slower gain']
            : const [
                'Keep the target',
                'Move to a gentler pace that matches what you are eating',
              ],
      );
    case StallDiagnosis.estimate:
      final change = a.expectedChangeKcal;
      final direction = a.gaining ? 'higher' : 'lower';
      final lead =
          'You have eaten at target and your weight has held. Your '
          'expenditure is $direction than estimated';
      final String body;
      if (a.atFloor) {
        body =
            '$lead. Your target is already the lowest the app will suggest, '
            'so it will not come down.';
      } else if (change == null) {
        body = '$lead. The coach will account for it at the next check-in.';
      } else {
        body =
            '$lead; the target ${a.gaining ? 'goes up' : 'comes down'} by '
            'about ${Fmt.whole(change.abs())} at the next check-in.';
      }
      return (
        a.estimateLow
            ? '$body An estimate this low often means some food is not making '
                  'it into the log. Common places to look: oils, drinks, '
                  'sauces, tastes while cooking.'
            : body,
        a.atFloor
            ? const [
                'Take a break at maintenance for a week or two',
                'Add some daily walking',
              ]
            : const [],
      );
  }
}
