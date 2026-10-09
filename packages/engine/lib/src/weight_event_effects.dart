import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'settling_window.dart';
import 'trend_shift.dart';

const weightEventStepPriorKg = 1.5;
const weightEventStepDays = 21;
const weightEventNoiseMultiplier = 1.6;
const weightEventReductionPauseDays = 28;

/// At most two transient events in each chronological 14-day window affect
/// the trend. Newest entries beyond that cap remain stored for the UI.
List<WeightEvent> effectiveWeightEvents(Iterable<WeightEvent> events) {
  final sorted = events.toList()
    ..sort((a, b) {
      final byDate = a.date.compareTo(b.date);
      return byDate != 0 ? byDate : a.type.index.compareTo(b.type.index);
    });
  final accepted = <WeightEvent>[];
  for (final event in sorted) {
    if (!event.type.isPassing) continue;
    final recentCount = accepted
        .where((prior) => prior.date.daysUntil(event.date) < 14)
        .length;
    if (recentCount < 2) accepted.add(event);
  }
  return accepted;
}

/// The lasting creatine transitions allowed to move the trend level.
List<WeightEvent> creatineWeightEvents({
  required Iterable<WeightEvent> events,
  CalendarDate? creatineStartedOn,
}) {
  final all = events.toList();
  if (creatineStartedOn != null &&
      !all.any(
        (event) =>
            event.date == creatineStartedOn &&
            event.type == WeightEventType.startedCreatine,
      )) {
    all.add(
      WeightEvent(
        date: creatineStartedOn,
        type: WeightEventType.startedCreatine,
      ),
    );
  }
  return [
    for (final event in all)
      if (event.type.isCreatineShift) event,
  ]..sort((a, b) => a.date.compareTo(b.date));
}

/// Transition windows are excluded from tissue-slope TDEE calculations.
List<SettlingWindow> weightEventSettlingWindows(
  Iterable<WeightEvent> creatineEvents,
) => [
  for (final event in creatineEvents)
    SettlingWindow(event.date, event.date.addDays(weightEventStepDays - 1)),
];

/// Adds a directional prior for a creatine shift but lets observed weights
/// determine its size. Its signed mean is 1.5 kg and its standard deviation
/// is 1.5 kg, each spread over 21 daily updates; it is not a fixed jump.
TrendShift? Function(CalendarDate) creatineEventShift(
  Iterable<WeightEvent> creatineEvents,
) {
  final byDay = <int, double>{};
  final dailySigma = weightEventStepPriorKg / math.sqrt(weightEventStepDays);
  for (final event in creatineEvents) {
    final direction = event.type == WeightEventType.startedCreatine ? 1 : -1;
    for (var day = 0; day < weightEventStepDays; day++) {
      final epochDay = event.date.epochDay + day;
      byDay.update(
        epochDay,
        (amount) =>
            amount + direction * weightEventStepPriorKg / weightEventStepDays,
        ifAbsent: () =>
            direction * weightEventStepPriorKg / weightEventStepDays,
      );
    }
  }
  final shifts = {
    for (final day in byDay.keys)
      day: TrendShift(
        levelMeanKg: byDay[day]!,
        levelSigmaKg: dailySigma,
        slopeSigmaKgPerDay: 0,
      ),
  };
  return (date) => shifts[date.epochDay];
}

/// Noise windows for transient events that passed the rolling cap.
double Function(CalendarDate) passingWeightEventNoise(
  Iterable<WeightEvent> passingEvents,
) {
  final noisyDays = <int>{};
  for (final event in passingEvents) {
    final daysAfter = event.type == WeightEventType.illness ? 7 : 4;
    for (
      var day = event.date.epochDay - 1;
      day <= event.date.epochDay + daysAfter;
      day++
    ) {
      noisyDays.add(day);
    }
  }
  return (date) =>
      noisyDays.contains(date.epochDay) ? weightEventNoiseMultiplier : 1;
}

TrendShift? Function(CalendarDate)? combineTrendShifts(
  TrendShift? Function(CalendarDate)? first,
  TrendShift? Function(CalendarDate)? second,
) {
  if (first == null) return second;
  if (second == null) return first;
  return (date) {
    final a = first(date), b = second(date);
    if (a == null) return b;
    if (b == null) return a;
    return TrendShift(
      levelMeanKg: a.levelMeanKg + b.levelMeanKg,
      levelSigmaKg: math.sqrt(
        a.levelSigmaKg * a.levelSigmaKg + b.levelSigmaKg * b.levelSigmaKg,
      ),
      slopeSigmaKgPerDay: math.sqrt(
        a.slopeSigmaKgPerDay * a.slopeSigmaKgPerDay +
            b.slopeSigmaKgPerDay * b.slopeSigmaKgPerDay,
      ),
    );
  };
}

extension on WeightEventType {
  bool get isCreatineShift =>
      this == WeightEventType.startedCreatine ||
      this == WeightEventType.stoppedCreatine;

  bool get isPassing => !isCreatineShift;
}
