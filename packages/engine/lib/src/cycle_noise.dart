import 'package:mm_domain/mm_domain.dart';

/// Returns a weight-noise multiplier per date that widens measurement noise
/// from [daysBefore] days before each menses start through [daysAfter] days
/// after, when water retention is highest.
///
/// A menses start is a flow day whose previous day had no flow.
double Function(CalendarDate) cycleNoiseMultiplier(
  Iterable<MenstruationDay> flowDays, {
  int daysBefore = 5,
  int daysAfter = 2,
  double multiplier = 1.6,
}) {
  final flow = {for (final d in flowDays) d.date.epochDay};
  final starts = [
    for (final day in flow)
      if (!flow.contains(day - 1)) day,
  ];
  if (starts.isEmpty) return (_) => 1.0;

  final widened = <int>{
    for (final start in starts)
      for (var d = start - daysBefore; d <= start + daysAfter; d++) d,
  };
  return (date) => widened.contains(date.epochDay) ? multiplier : 1.0;
}
