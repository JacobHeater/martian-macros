import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-116: when the weekly recovery check-in is offered.
void main() {
  final today = CalendarDate(2026, 10, 5);

  RecoveryCheckIn answered(int daysAgo) => RecoveryCheckIn(
    date: today.addDays(-daysAgo),
    hunger: 3,
    energy: 3,
    sleep: 3,
    training: 3,
    mood: 3,
  );

  bool due({
    int onboardedDaysAgo = 30,
    List<RecoveryCheckIn> checkIns = const [],
    int? skippedDaysAgo,
    bool paused = false,
  }) => recoveryCheckInDue(
    today: today,
    onboardedOn: today.addDays(-onboardedDaysAgo),
    checkIns: checkIns,
    skippedOn: skippedDaysAgo == null ? null : today.addDays(-skippedDaysAgo),
    paused: paused,
  );

  test('is offered once a week has passed since setup', () {
    expect(due(onboardedDaysAgo: 6), isFalse);
    expect(due(onboardedDaysAgo: 7), isTrue);
  });

  test('is not offered again in the week it was answered', () {
    expect(due(checkIns: [answered(0)]), isFalse);
    expect(due(checkIns: [answered(6)]), isFalse);
    expect(due(checkIns: [answered(7)]), isTrue);
  });

  test('a skip lasts the week and no longer', () {
    expect(due(skippedDaysAgo: 0), isFalse);
    expect(due(skippedDaysAgo: 6), isFalse);
    expect(due(skippedDaysAgo: 7), isTrue);
  });

  test('an old answer and an old skip do not hold it back', () {
    expect(
      due(checkIns: [answered(30), answered(14)], skippedDaysAgo: 21),
      isTrue,
    );
  });

  test('is not offered during a pause', () {
    expect(due(paused: true), isFalse);
  });
}
