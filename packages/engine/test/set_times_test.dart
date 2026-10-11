import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  final base = DateTime(2026, 10, 5, 18);
  DateTime at(int minute) => base.add(Duration(minutes: minute));
  WorkoutSet set(int? start, int? end) => WorkoutSet(
    reps: 8,
    loadKg: 100,
    startedAt: start == null ? null : at(start),
    endedAt: end == null ? null : at(end),
  );
  TimeSpanProblem? check(int? start, int? end, List<WorkoutSet> others) =>
      checkSetTimes(
        start: start == null ? null : at(start),
        end: end == null ? null : at(end),
        otherSets: others,
        notBefore: base,
        notAfter: at(60),
      );

  test('MM-196 refuses intersecting intervals and either containment', () {
    final others = [set(2, 4)];
    expect(check(1, 3, others), TimeSpanProblem.overlappingSet);
    expect(check(3, 5, others), TimeSpanProblem.overlappingSet);
    expect(check(1, 5, others), TimeSpanProblem.overlappingSet);
    expect(check(2, 3, others), TimeSpanProblem.overlappingSet);
    expect(check(2, 4, others), TimeSpanProblem.overlappingSet);
  });

  test('adjacent or disjoint intervals are allowed in either order', () {
    final others = [set(2, 4)];
    expect(check(0, 2, others), isNull);
    expect(check(4, 5, others), isNull);
    expect(check(6, 8, others), isNull);
    expect(check(2, 4, [set(4, 5), set(0, 2)]), isNull);
  });

  test('a partial candidate conflicts only inside a complete interval', () {
    final others = [set(2, 4)];
    expect(check(3, null, others), TimeSpanProblem.overlappingSet);
    expect(check(null, 3, others), TimeSpanProblem.overlappingSet);
    expect(check(null, 2, others), isNull);
    expect(check(4, null, others), isNull);
    expect(check(null, null, others), isNull);
  });

  test('a complete candidate cannot contain another known timestamp', () {
    expect(check(2, 4, [set(3, null)]), TimeSpanProblem.overlappingSet);
    expect(check(2, 4, [set(null, 3)]), TimeSpanProblem.overlappingSet);
    expect(check(2, 4, [set(null, 2), set(4, null)]), isNull);
  });

  test('missing times do not invent ranges or conflicts between points', () {
    final others = [set(null, null), set(null, 3), set(5, null)];
    expect(check(3, 5, others), isNull);
    expect(check(4, null, others), isNull);
    expect(check(null, 4, others), isNull);
    expect(check(null, 3, others), isNull);
  });

  test('bounds and ordering retain their existing refusal reasons', () {
    expect(check(4, 3, [set(2, 5)]), TimeSpanProblem.endNotAfterStart);
    expect(check(-1, 3, [set(2, 5)]), TimeSpanProblem.tooEarly);
    expect(check(3, 61, [set(2, 5)]), TimeSpanProblem.tooLate);
    expect(check(0, 60, []), isNull);
  });
}
