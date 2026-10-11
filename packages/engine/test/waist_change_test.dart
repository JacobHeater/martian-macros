import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-155: one answer to "has the waist changed over this period?".
void main() {
  final today = CalendarDate(2026, 10, 11);

  List<WaistObservation> on(Map<int, double> byDaysAgo) => [
    for (final entry in byDaysAgo.entries)
      WaistObservation(date: today.addDays(-entry.key), waistCm: entry.value),
  ];

  WaistChange? over(
    Map<int, double> byDaysAgo, {
    int days = 28,
    double? noiseCm,
  }) => noiseCm == null
      ? waistChangeOf(waist: on(byDaysAgo), asOf: today, days: days)
      : waistChangeOf(
          waist: on(byDaysAgo),
          asOf: today,
          days: days,
          noiseCm: noiseCm,
        );

  group('over a period', () {
    test('92.0 four weeks ago and 91.2 now is no clear change', () {
      final change = over({
        35: 92,
        28: 92,
        21: 92,
        14: 91.2,
        7: 91.2,
        0: 91.2,
      })!;
      expect(change.direction, MeasuredChange.noClearChange);
      expect(change.changeCm, closeTo(-0.8, 1e-9));
      expect(change.thresholdCm, closeTo(1.4, 1e-9));
    });

    test('92.0 eight weeks ago and 89.5 now is down 2.5', () {
      final change = over({
        63: 92,
        56: 92,
        49: 92,
        14: 89.5,
        7: 89.5,
        0: 89.5,
      }, days: 56)!;
      expect(change.direction, MeasuredChange.down);
      expect(change.changeCm, closeTo(-2.5, 1e-9));
      expect(change.fromCm, 92);
      expect(change.toCm, 89.5);
    });

    test('up is reported as up', () {
      expect(over({28: 90, 7: 92, 0: 92})!.direction, MeasuredChange.up);
    });

    test('each end is the middle of up to three entries, so one odd '
        'reading does not decide it', () {
      // Now: 90, 93.5 (a bloated morning), 90. Then: 92, 92, 89 (a slip).
      final change = over({35: 92, 28: 92, 22: 89, 14: 90, 7: 93.5, 0: 90})!;
      expect(change.fromCm, 92);
      expect(change.toCm, 90);
      expect(change.recentEntries, 3);
      expect(change.baselineEntries, 3);
      expect(change.direction, MeasuredChange.down);
    });

    test('a change of exactly the threshold counts, and a hair less does '
        'not', () {
      expect(over({28: 92, 0: 90.6})!.direction, MeasuredChange.down);
      expect(over({28: 92, 0: 90.61})!.direction, MeasuredChange.noClearChange);
    });

    test('single readings are noisier: the same difference is not a '
        'change', () {
      final entries = {28: 92.0, 0: 90.2};
      expect(over(entries)!.direction, MeasuredChange.down);
      final single = over(entries, noiseCm: WaistRule.singleReadingNoiseCm)!;
      expect(single.direction, MeasuredChange.noClearChange);
      expect(single.thresholdCm, closeTo(2.1, 1e-9));
    });

    test('nothing in the last two weeks: there is no now to compare', () {
      expect(over({28: 92, 14: 90}), isNull);
      expect(over({28: 92, 13: 90}), isNotNull);
    });

    test('nothing near the day compared with: there is no then', () {
      expect(over({60: 92, 0: 90}), isNull);
      expect(over({38: 92, 0: 90}), isNotNull);
      expect(over({39: 92, 0: 90}), isNull);
    });

    test('an entry is never at both ends', () {
      // Three weekly entries and nothing older: all three are "now".
      expect(over({14: 92, 7: 91, 0: 90}, days: 14), isNull);
      // The fourth, older than the three, is "then".
      final change = over({21: 92, 14: 91, 7: 90.5, 0: 90}, days: 21)!;
      expect(change.fromCm, 92);
      expect(change.toCm, 90.5);
    });

    test('entries after the day asked about are not used', () {
      final change = waistChangeOf(
        waist: on({35: 92, 28: 92, 7: 91.9, 0: 80}),
        asOf: today.addDays(-7),
        days: 21,
      )!;
      expect(change.toCm, 91.9);
    });

    test('no entries is no answer', () {
      expect(over(const {}), isNull);
    });
  });

  group('since the start', () {
    WaistChange? sinceStart(Map<int, double> byDaysAgo) =>
        waistChangeOf(waist: on(byDaysAgo), asOf: today, sinceStart: true);

    test('the start is the middle of the first three entries, not the '
        'first', () {
      final change = sinceStart({
        70: 94,
        63: 92,
        56: 92.5,
        14: 90,
        7: 90,
        0: 90,
      })!;
      expect(change.fromCm, 92.5);
      expect(change.changeCm, closeTo(-2.5, 1e-9));
      expect(change.direction, MeasuredChange.down);
    });

    test('with few entries no entry is at both ends', () {
      expect(sinceStart({0: 90}), isNull);
      final two = sinceStart({14: 92, 0: 90})!;
      expect(two.baselineEntries, 1);
      expect(two.recentEntries, 1);
      final five = sinceStart({28: 93, 21: 92, 14: 91, 7: 90, 0: 89})!;
      expect(five.baselineEntries, 2);
      expect(five.recentEntries, 3);
      expect(five.fromCm, 92.5);
      expect(five.toCm, 90);
    });

    test('it still needs a measurement from the last two weeks', () {
      expect(sinceStart({60: 94, 50: 92, 20: 90}), isNull);
    });
  });
}
