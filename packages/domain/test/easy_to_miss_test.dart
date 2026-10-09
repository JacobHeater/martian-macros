import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-152: when the easy-to-miss line appears.
void main() {
  final start = CalendarDate(2026, 9, 1);

  bool visible(
    int dayOfUse, {
    CalendarDate? lastShown,
    bool enabled = true,
    bool suppressed = false,
  }) => easyToMissVisible(
    today: start.addDays(dayOfUse - 1),
    onboardedOn: start,
    preference: EasyToMissPreference(enabled: enabled, lastShown: lastShown),
    suppressed: suppressed,
  );

  test('shown every time in the first 14 days', () {
    expect(visible(1), isTrue);
    expect(visible(3), isTrue);
    expect(visible(14, lastShown: start.addDays(12)), isTrue);
  });

  test('not shown the day after it was shown once past day 14', () {
    expect(visible(30, lastShown: start.addDays(28)), isFalse);
    expect(visible(30, lastShown: start.addDays(23)), isFalse);
  });

  test('shown again once a week has passed', () {
    expect(visible(30, lastShown: start.addDays(22)), isTrue);
    expect(visible(30), isTrue, reason: 'never shown');
  });

  test('stays visible for the rest of the day it first appeared on', () {
    expect(visible(30, lastShown: start.addDays(29)), isTrue);
  });

  test('never when turned off or suppressed', () {
    expect(visible(3, enabled: false), isFalse);
    expect(visible(30, enabled: false), isFalse);
    expect(visible(3, suppressed: true), isFalse);
  });
}
