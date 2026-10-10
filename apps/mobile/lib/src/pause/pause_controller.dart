import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// Starts, extends and ends pauses (MM-148), keeping the weight events an
/// illness or injury pause records in step with it.
final class PauseController {
  const PauseController({required this.pauses, required this.weightEvents});

  final PauseWriter pauses;
  final WeightEventWriter weightEvents;

  Future<void> start(Pause pause) async {
    await pauses.savePause(pause);
    for (final event in pauseWeightEvents(pause)) {
      await weightEvents.saveWeightEvent(event);
    }
  }

  /// Moves the end date [days] later. Allowed once per pause.
  Future<void> extend(Pause pause, {int days = 7}) async {
    if (pause.extended) return;
    await start(pause.copyWith(to: pause.to.addDays(days), extended: true));
  }

  /// Ends [pause] as of [today]: yesterday becomes its last day. One that has
  /// not reached its second day is removed, with the events it recorded.
  Future<void> endNow(Pause pause, CalendarDate today) async {
    if (!pause.from.isBefore(today)) {
      for (final event in pauseWeightEvents(pause)) {
        await weightEvents.deleteWeightEvent(event);
      }
      await pauses.deletePause(pause);
      return;
    }
    if (pause.to.isBefore(today)) return;
    final shortened = pause.copyWith(to: today.addDays(-1));
    final kept = pauseWeightEvents(shortened);
    for (final event in pauseWeightEvents(pause)) {
      if (!kept.any((k) => k.date == event.date)) {
        await weightEvents.deleteWeightEvent(event);
      }
    }
    await pauses.savePause(shortened);
  }
}
