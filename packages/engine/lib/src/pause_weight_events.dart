import 'package:mm_domain/mm_domain.dart';

/// The weight events an illness or injury pause records for its own dates,
/// so the scale is discounted without the user being asked twice (MM-148,
/// MM-136). One a week across the pause, which is as many as the trend takes
/// into account. Travel and other pauses record none.
List<WeightEvent> pauseWeightEvents(Pause pause) {
  final type = switch (pause.reason) {
    PauseReason.illness => WeightEventType.illness,
    PauseReason.injury => WeightEventType.other,
    PauseReason.travel || PauseReason.other => null,
  };
  if (type == null) return const [];
  return [
    for (var day = 0; day < pause.days; day += 7)
      WeightEvent(date: pause.from.addDays(day), type: type),
  ];
}
