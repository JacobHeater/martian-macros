import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-92: a logging streak that forgives one missed day and rewards nothing
/// but the work.
void main() {
  final today = CalendarDate(2026, 10, 14);

  IntakeDay day(int daysAgo, {double kcal = 2200}) => IntakeDay(
    date: today.addDays(-daysAgo),
    kcal: kcal,
    proteinG: 150,
    carbsG: 220,
    fatG: 70,
    completeness: DayCompleteness.complete,
  );

  LoggingStreak streak(
    Iterable<int> loggedDaysAgo, {
    Iterable<Pause> pauses = const [],
    Map<int, double> kcal = const {},
  }) => loggingStreakOf(
    today: today,
    intake: [for (final d in loggedDaysAgo) day(d, kcal: kcal[d] ?? 2200)],
    pauses: pauses,
  );

  test('nothing logged is no streak', () {
    expect(streak(const []).days, 0);
  });

  test('whole days in a row count', () {
    expect(streak([1, 2, 3, 4, 5]).days, 5);
  });

  test('today counts once it is whole, and is never a miss before', () {
    expect(streak([0, 1, 2]).days, 3);
    expect(streak([1, 2, 3]).days, 3, reason: 'today not logged yet');
  });

  test('six complete days, one missed, then another continues', () {
    final s = streak([1, 2, 3, 4, 5, 6, 8]);
    expect(s.days, 7);
    expect(s.forgivenOn, today.addDays(-7));
  });

  test('a second miss within a week breaks it', () {
    // Complete 1, 2, 4 and 6; missed 3 and 5. The streak ends at the second
    // miss, keeping what came before it: days 1, 2 and 4.
    expect(streak([1, 2, 4, 6]).days, 3);
  });

  test('two misses a full week apart are two different weeks', () {
    // Missed days 7 and 14, seven days apart: both are forgiven.
    final s = streak([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15]);
    expect(s.days, 13);
  });

  test('two missed days running break it at once', () {
    expect(streak([3, 4, 5]).days, 0);
  });

  test('a missed day just before the latest log is forgiven', () {
    final s = streak([2, 3, 4]);
    expect(s.days, 3);
    expect(s.forgivenOn, today.addDays(-1));
  });

  test('days before the first log are not misses', () {
    expect(streak([1, 2, 3]).forgivenOn, isNull);
  });

  test('eating under target earns nothing extra: a day is a day', () {
    final low = streak([1, 2, 3], kcal: {1: 1700, 2: 2200, 3: 2200});
    final high = streak([1, 2, 3], kcal: {1: 2800, 2: 2200, 3: 2200});
    expect(low.days, 3);
    expect(high.days, 3);
  });

  test('a partial day is not a whole day', () {
    final s = loggingStreakOf(
      today: today,
      intake: [
        day(1),
        IntakeDay(
          date: today.addDays(-2),
          kcal: 500,
          proteinG: 20,
          carbsG: 50,
          fatG: 10,
          completeness: DayCompleteness.partial,
        ),
        day(3),
        day(4),
      ],
    );
    expect(s.days, 3);
    expect(s.forgivenOn, today.addDays(-2));
  });

  group('a pause', () {
    final pause = Pause(
      from: today.addDays(-9),
      to: today.addDays(-3),
      reason: PauseReason.travel,
    );

    test('neither counts nor breaks the streak', () {
      final s = streak([1, 2, 10, 11, 12], pauses: [pause]);
      expect(s.days, 5);
      expect(s.forgivenOn, isNull);
    });

    test('without it the same log would be broken', () {
      expect(streak([1, 2, 10, 11, 12]).days, 2);
    });

    test('does not use up the forgiven day', () {
      // Missed day 3 is paused; day 10 is a real miss and is forgiven.
      final s = streak([1, 2, 11, 12], pauses: [pause]);
      expect(s.days, 4);
      expect(s.forgivenOn, today.addDays(-10));
    });
  });
}
