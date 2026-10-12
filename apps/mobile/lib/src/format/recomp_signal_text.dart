import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';
import 'waist_amount.dart';

/// What the recomp signal card says (MM-32), or null when there is nothing
/// to say. With the signal present: the three things seen, and what they do
/// and do not show. With one measure not logged: what logging it would add.
///
/// It names a pattern. It never says fat was lost or muscle gained: a tape,
/// a scale and a training log cannot measure either.
String? recompSignalText(RecompSignal signal, Fmt fmt) {
  if (signal.present) {
    final lifts = [for (final name in signal.liftsUp) name.toLowerCase()];
    final named = lifts.length <= 2
        ? lifts.join(' and ')
        : '${lifts.take(2).join(', ')} and ${lifts.length - 2} more';
    return 'Trend weight held near ${fmt.weight(signal.trendWeightKg!)}. '
        'Waist down about ${waistAmount(signal.waistChangeCm!, fmt)}. '
        'Estimated maxes are up on $named. '
        'This pattern is consistent with losing fat while keeping or gaining '
        'muscle. It does not measure either.';
  }
  return switch (signal.onlyMissing) {
    RecompMeasure.waist =>
      'Your trend weight is holding and your lifts are going up. Measure '
          'your waist once a week to see whether it is coming down too.',
    RecompMeasure.strength =>
      'Your trend weight is holding and your waist is down. Log your '
          'training to see whether your lifts are going up too.',
    RecompMeasure.weight =>
      'Your waist is down and your lifts are going up. Weigh in on most '
          'mornings to see whether your weight is holding.',
    null => null,
  };
}
