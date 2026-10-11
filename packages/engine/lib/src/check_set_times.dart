import 'package:mm_domain/mm_domain.dart';

import 'check_time_span.dart';
import 'time_span_problem.dart';

/// Checks a typed set against the workout bounds and all [otherSets].
/// The caller excludes the edited set. Missing times never imply an interval.
TimeSpanProblem? checkSetTimes({
  required Iterable<WorkoutSet> otherSets,
  DateTime? start,
  DateTime? end,
  DateTime? notBefore,
  DateTime? notAfter,
}) {
  final problem = checkTimeSpan(
    start: start,
    end: end,
    notBefore: notBefore,
    notAfter: notAfter,
  );
  if (problem != null) return problem;

  for (final set in otherSets) {
    final otherStart = set.startedAt;
    final otherEnd = set.endedAt;
    if (start != null && end != null) {
      if (otherStart != null && otherEnd != null) {
        if (start.isBefore(otherEnd) && end.isAfter(otherStart)) {
          return TimeSpanProblem.overlappingSet;
        }
      } else {
        final known = otherStart ?? otherEnd;
        if (known != null && known.isAfter(start) && known.isBefore(end)) {
          return TimeSpanProblem.overlappingSet;
        }
      }
    } else if (otherStart != null && otherEnd != null) {
      final known = start ?? end;
      if (known != null &&
          known.isAfter(otherStart) &&
          known.isBefore(otherEnd)) {
        return TimeSpanProblem.overlappingSet;
      }
    }
  }
  return null;
}
