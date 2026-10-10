import 'package:mm_domain/mm_domain.dart';

import 'activity_gap.dart';
import 'gap_rule.dart';

/// Every run of at least [minimumDays] days with no weigh-in and no food
/// logged, oldest first, up to the day before [today] (MM-147). Today is not
/// over, so it is never part of a gap; a gap is open while today also has
/// nothing recorded.
///
/// A paused day is never part of a gap (MM-148): a planned break is not a
/// lapse.
List<ActivityGap> activityGaps({
  required Iterable<WeightObservation> weights,
  required Iterable<IntakeDay> intake,
  required CalendarDate today,
  Iterable<Pause> pauses = const [],
  int minimumDays = GapRule.minimumDays,
}) {
  final active = <int>{
    for (final w in weights)
      if (!w.date.isAfter(today)) w.date.epochDay,
    for (final d in intake)
      if (d.kcal > 0 && !d.date.isAfter(today)) d.date.epochDay,
    for (final p in pauses)
      for (var day = p.from.epochDay; day <= p.to.epochDay; day++)
        if (day <= today.epochDay) day,
  }.toList()..sort();
  if (active.isEmpty) return const [];
  final gaps = <ActivityGap>[];
  void add(int afterDay, int beforeDay) {
    if (beforeDay - afterDay - 1 >= minimumDays) {
      gaps.add(
        ActivityGap(
          from: CalendarDate.fromEpochDay(afterDay + 1),
          to: CalendarDate.fromEpochDay(beforeDay - 1),
        ),
      );
    }
  }

  for (var i = 1; i < active.length; i++) {
    add(active[i - 1], active[i]);
  }
  if (active.last != today.epochDay) add(active.last, today.epochDay);
  return gaps;
}
