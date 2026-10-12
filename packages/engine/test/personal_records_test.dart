import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-92: a session that gives a lift its best estimated max so far.
void main() {
  final today = CalendarDate(2026, 10, 11);
  final squat = builtInExercises.firstWhere((e) => e.id == 'back-squat');
  final row = builtInExercises.firstWhere((e) => e.id == 'barbell-row');

  /// A finished workout [daysAgo]: exercise id to (reps, kg), one set each.
  Workout trained(
    int id,
    int daysAgo,
    Map<String, (int, double)> sets, {
    bool finished = true,
  }) {
    final date = today.addDays(-daysAgo);
    final start = DateTime(date.year, date.month, date.day, 18);
    return Workout(
      id: id,
      date: date,
      startedAt: start,
      endedAt: finished ? start.add(const Duration(minutes: 50)) : null,
      exercises: [
        for (final entry in sets.entries)
          WorkoutExercise(
            exerciseId: entry.key,
            sets: [WorkoutSet(reps: entry.value.$1, loadKg: entry.value.$2)],
          ),
      ],
    );
  }

  Map<int, List<PersonalRecord>> records(List<Workout> workouts) =>
      personalRecordsOf(
        buildStrengthTrends(
          workouts: workouts,
          exercises: [squat, row],
          weights: const [],
          today: today,
        ),
      );

  test('the first session of a lift sets no record', () {
    expect(
      records([
        trained(1, 7, {squat.id: (6, 100)}),
      ]),
      isEmpty,
    );
  });

  test('a better session is a record, with what it beat', () {
    final found = records([
      trained(1, 14, {squat.id: (6, 100)}),
      trained(2, 7, {squat.id: (6, 105)}),
    ]);
    expect(found.keys, [2]);
    final record = found[2]!.single;
    expect(record.exerciseId, squat.id);
    expect(record.name, squat.name);
    expect(record.estimateKg, closeTo(105 * (1 + 6 / 30), 1e-9));
    expect(record.previousBestKg, closeTo(100 * (1 + 6 / 30), 1e-9));
  });

  test('more reps at the same load is a record too', () {
    final found = records([
      trained(1, 14, {squat.id: (6, 100)}),
      trained(2, 7, {squat.id: (7, 100)}),
    ]);
    expect(found[2], hasLength(1));
  });

  test('matching the best is not a record', () {
    expect(
      records([
        trained(1, 14, {squat.id: (6, 100)}),
        trained(2, 7, {squat.id: (6, 100)}),
      ]),
      isEmpty,
    );
  });

  test('a record has to beat every earlier session, not only the last', () {
    final found = records([
      trained(1, 21, {squat.id: (6, 110)}),
      trained(2, 14, {squat.id: (6, 100)}),
      trained(3, 7, {squat.id: (6, 105)}),
    ]);
    expect(found, isEmpty);
  });

  test('a record stays one after a later session beats it', () {
    final found = records([
      trained(1, 21, {squat.id: (6, 100)}),
      trained(2, 14, {squat.id: (6, 105)}),
      trained(3, 7, {squat.id: (6, 110)}),
    ]);
    expect(found.keys, unorderedEquals([2, 3]));
    expect(found[3]!.single.previousBestKg, closeTo(105 * 1.2, 1e-9));
  });

  test('one workout can set a record on more than one lift', () {
    final found = records([
      trained(1, 14, {squat.id: (6, 100), row.id: (6, 60)}),
      trained(2, 7, {squat.id: (6, 105), row.id: (6, 62.5)}),
    ]);
    expect(found[2]!.map((r) => r.exerciseId), [squat.id, row.id]);
  });

  test('a workout still in progress sets none yet', () {
    expect(
      records([
        trained(1, 14, {squat.id: (6, 100)}),
        trained(2, 0, {squat.id: (6, 120)}, finished: false),
      ]),
      isEmpty,
    );
  });
}
