import 'package:mm_health_ingest/mm_health_ingest.dart';

import 'clock_time_text.dart';

/// Where an imported weigh-in came from and why it is the one that counts
/// (MM-71): "From Bathroom scale at 6:42 AM." or "The middle of 3 readings
/// from Bathroom scale."
String importedWeighInText(DayWeighIn weighIn) {
  final at = weighIn.at;
  if (weighIn.basis == WeighInBasis.firstMorning && at != null) {
    return 'From ${weighIn.sourceName} at ${clockTimeText(at)}.';
  }
  return weighIn.readings == 1
      ? 'From ${weighIn.sourceName}.'
      : 'The middle of ${weighIn.readings} readings from '
            '${weighIn.sourceName}.';
}
