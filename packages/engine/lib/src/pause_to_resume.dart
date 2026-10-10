import 'package:mm_domain/mm_domain.dart';

import 'latest_ended_pause.dart';
import 'pause_on.dart';

/// The pause the user is coming out of on [today], or null (MM-148): the
/// latest one that has ended, while no weigh-in has been saved since it ended
/// and no other pause is running. The resume screen asks for that weigh-in.
Pause? pauseToResume({
  required Iterable<Pause> pauses,
  required Iterable<WeightObservation> weights,
  required CalendarDate today,
}) {
  final all = pauses.toList();
  if (pauseOn(all, today) != null) return null;
  final latest = latestEndedPause(all, today);
  if (latest == null) return null;
  return weights.any((w) => w.date.isAfter(latest.to)) ? null : latest;
}
