import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-114: notice sustained intake far below the floor; never a single day,
/// never days the user marked partial.
void main() {
  final through = CalendarDate(2026, 3, 14);

  List<IntakeDay> days(
    int count,
    double kcal, {
    DayCompleteness completeness = DayCompleteness.complete,
  }) => [
    for (var i = 0; i < count; i++)
      IntakeDay(
        date: through.addDays(-i),
        kcal: kcal,
        proteinG: 80,
        carbsG: 100,
        fatG: 30,
        completeness: completeness,
      ),
  ];

  UnderEatingFinding? find(List<IntakeDay> intake, {double floor = 1500}) =>
      findUnderEating(through: through, intake: intake, floorKcal: floor);

  test('sustained low intake is found, with both figures', () {
    final f = find(days(9, 1050))!;
    expect(f.averageKcal, 1050);
    expect(f.floorKcal, 1500);
    expect(f.days, 9);
    expect(f.lowDays, hasLength(9));
  });

  test('days marked partial never count', () {
    expect(find(days(9, 1050, completeness: DayCompleteness.partial)), isNull);
  });

  test('too few days is not a pattern', () {
    expect(find(days(4, 1000)), isNull);
    expect(find(days(6, 1000)), isNull);
    expect(find(days(7, 1000)), isNotNull);
  });

  test('slightly under the floor is not noticed', () {
    expect(find(days(9, 1420)), isNull);
    expect(find(days(9, 1350)), isNull, reason: 'exactly 10% below');
    expect(find(days(9, 1349)), isNotNull);
  });

  test('days older than two weeks are not counted', () {
    final old = [
      for (var i = 14; i < 24; i++)
        IntakeDay(
          date: through.addDays(-i),
          kcal: 900,
          proteinG: 60,
          carbsG: 90,
          fatG: 30,
          completeness: DayCompleteness.complete,
        ),
    ];
    expect(find(old), isNull);
  });

  test('it clears when the average rises', () {
    expect(find([...days(5, 1050), ...days(9, 2100).map(_shift(5))]), isNull);
  });

  test('dismissed, it stays quiet for 14 days', () {
    final dismissed = CalendarDate(2026, 3, 1);
    expect(
      underEatingNoticeDue(today: dismissed.addDays(5), dismissedOn: dismissed),
      isFalse,
    );
    expect(
      underEatingNoticeDue(
        today: dismissed.addDays(14),
        dismissedOn: dismissed,
      ),
      isTrue,
    );
    expect(underEatingNoticeDue(today: dismissed, dismissedOn: null), isTrue);
  });
}

IntakeDay Function(IntakeDay) _shift(int by) =>
    (d) => IntakeDay(
      date: d.date.addDays(-by),
      kcal: d.kcal,
      proteinG: d.proteinG,
      carbsG: d.carbsG,
      fatG: d.fatG,
      completeness: d.completeness,
    );
