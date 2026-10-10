import 'time_span_problem.dart';

/// What is wrong with a typed [start] and [end], or null if nothing is
/// (MM-191). Either may be missing; what is there must make sense: an end
/// after its start, and both within [notBefore] and [notAfter] when given.
/// A time that breaks this is refused by the caller, never moved.
TimeSpanProblem? checkTimeSpan({
  DateTime? start,
  DateTime? end,
  DateTime? notBefore,
  DateTime? notAfter,
}) {
  if (start != null && end != null && !end.isAfter(start)) {
    return TimeSpanProblem.endNotAfterStart;
  }
  for (final time in [start, end]) {
    if (time == null) continue;
    if (notBefore != null && time.isBefore(notBefore)) {
      return TimeSpanProblem.tooEarly;
    }
    if (notAfter != null && time.isAfter(notAfter)) {
      return TimeSpanProblem.tooLate;
    }
  }
  return null;
}
