import 'package:mm_domain/mm_domain.dart';

import 'default_rep_range.dart';
import 'next_load_kg.dart';
import 'progression_kind.dart';
import 'progression_suggestion.dart';

/// What to try for [exerciseId] next (MM-79), by double progression: more
/// reps at the same load until every set reaches the top of the rep range,
/// then more load at the bottom of it. Null when the exercise has never
/// been done in a finished workout started before [before].
///
/// A session is the sets of the exercise, with reps, in one finished
/// workout. Its top load is the heaviest logged, and only the sets at that
/// load count, so warm-up sets, which are logged as ordinary sets, do not.
///
/// - Every such set at the top of the range: add load.
/// - Losing fat ([GoalMode.fatLoss]): match last time; holding strength
///   is the aim, and nothing is said about a stall.
/// - The last three sessions at one top load, no more than 28 days
///   apart, and neither of the last two with more reps than the first: hold.
/// - Otherwise: the same load, for last time's first set's reps or more.
///
/// It never suggests less load.
ProgressionSuggestion? suggestProgression({
  required String exerciseId,
  required Exercise? exercise,
  required Iterable<Workout> workouts,
  required DateTime before,
  required GoalMode goal,
  required UnitSystem units,
}) {
  // Loads closer than this are the same load: a difference of rounding
  // between units, not of plates.
  const sameLoadKg = 0.05;
  // How far apart sessions may be and still be compared for a stall, as
  // for the strength trend (MM-77).
  const stallWindow = Duration(days: 28);

  final finished =
      workouts
          .where((w) => !w.inProgress && w.startedAt.isBefore(before))
          .toList()
        ..sort((a, b) {
          final date = b.date.compareTo(a.date);
          if (date != 0) return date;
          final time = b.startedAt.compareTo(a.startedAt);
          return time != 0 ? time : b.id.compareTo(a.id);
        });

  // The last three sessions, newest first: when, top load, reps at it.
  final sessions = <(DateTime, double, List<int>)>[];
  for (final workout in finished) {
    final sets = [
      for (final entry in workout.exercises)
        if (entry.exerciseId == exerciseId)
          for (final set in entry.sets)
            if (set.reps > 0) set,
    ];
    if (sets.isEmpty) continue;
    final top = sets.map((s) => s.loadKg).reduce((a, b) => a > b ? a : b);
    sessions.add((
      workout.startedAt,
      top,
      [
        for (final set in sets)
          if ((set.loadKg - top).abs() < sameLoadKg) set.reps,
      ],
    ));
    if (sessions.length == 3) break;
  }
  if (sessions.isEmpty) return null;

  final (_, load, reps) = sessions.first;
  final (bottom, top) = defaultRepRange(exercise);
  ProgressionSuggestion suggest(ProgressionKind kind, double loadKg, int n) =>
      ProgressionSuggestion(
        kind: kind,
        loadKg: loadKg,
        reps: n,
        lastLoadKg: load,
        lastReps: reps,
        rangeTop: top,
      );

  final more = nextLoadKg(exercise: exercise, units: units, loadKg: load);
  if (goal == GoalMode.fatLoss) {
    return suggest(ProgressionKind.match, load, reps.first);
  }
  if (more != null && reps.every((n) => n >= top)) {
    return suggest(ProgressionKind.addLoad, more, bottom);
  }
  bool stalled() {
    if (sessions.length < 3) return false;
    int total(List<int> reps) => reps.fold(0, (sum, n) => sum + n);
    for (var i = 0; i < 3; i++) {
      final (at, sessionLoad, _) = sessions[i];
      if ((sessionLoad - load).abs() >= sameLoadKg) return false;
      if (i > 0 && sessions[i - 1].$1.difference(at) > stallWindow) {
        return false;
      }
    }
    final first = total(sessions[2].$3);
    return total(sessions[0].$3) <= first && total(sessions[1].$3) <= first;
  }

  if (stalled()) {
    return suggest(ProgressionKind.hold, load, reps.first);
  }
  // With no load to add to, the reps are not capped by the range.
  final aim = more == null ? reps.first : reps.first.clamp(bottom, top);
  return suggest(ProgressionKind.addReps, load, aim);
}
