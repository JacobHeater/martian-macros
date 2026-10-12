import 'package:mm_health_ingest/mm_health_ingest.dart';
import 'package:test/test.dart';

/// MM-71: which imported weigh-in counts for a day.
void main() {
  var nextId = 0;
  HealthSample weight(
    double kg,
    int day,
    int hour,
    int minute, {
    String source = 'scale',
  }) => HealthSample(
    platformId: 'w-${nextId++}',
    type: HealthDataType.weight,
    value: kg,
    start: DateTime(2026, 9, day, hour, minute),
    sourceId: source,
    sourceName: source == 'scale' ? 'Bathroom scale' : 'Gym scale',
  );

  test('morning and evening: the morning reading counts', () {
    final day = dailyWeighIns([weight(82.9, 1, 21, 10), weight(82.1, 1, 6, 40)])
        .single;
    expect(day.kg, 82.1);
    expect(day.basis, WeighInBasis.firstMorning);
    expect(day.at, DateTime(2026, 9, 1, 6, 40));
    expect(day.day, DateTime(2026, 9, 1));
    expect(day.sourceName, 'Bathroom scale');
    expect(day.readings, 2);
  });

  test('two in the morning: the first of them counts', () {
    final day = dailyWeighIns([weight(82.4, 1, 9, 0), weight(82.0, 1, 6, 40)])
        .single;
    expect(day.kg, 82.0);
  });

  test('the morning runs from 04:00 up to noon', () {
    expect(
      dailyWeighIns([weight(82, 1, 3, 59), weight(83, 1, 4, 0)]).single.kg,
      83,
    );
    final noon = dailyWeighIns([weight(82, 1, 12, 0)]).single;
    expect(noon.basis, WeighInBasis.medianOfDay);
    expect(
      dailyWeighIns([weight(82, 1, 11, 59)]).single.basis,
      WeighInBasis.firstMorning,
    );
  });

  test('no morning reading: the middle value counts', () {
    final day = dailyWeighIns([
      weight(83.0, 1, 22, 0),
      weight(82.0, 1, 13, 0),
      weight(82.4, 1, 18, 0),
    ]).single;
    expect(day.kg, 82.4);
    expect(day.basis, WeighInBasis.medianOfDay);
    expect(day.at, isNull);
    expect(day.readings, 3);
  });

  test('the middle of two is half way between them', () {
    expect(
      dailyWeighIns([weight(82, 1, 13, 0), weight(83, 1, 20, 0)]).single.kg,
      82.5,
    );
  });

  test('two scales: the primary scale\'s reading counts, even when the '
      'other was earlier', () {
    final day = dailyWeighIns([
      weight(84.0, 1, 5, 0, source: 'gym'),
      weight(82.1, 1, 6, 40),
    ], primarySourceId: 'scale').single;
    expect(day.kg, 82.1);
    expect(day.sourceName, 'Bathroom scale');
    expect(day.readings, 1);
  });

  test('a day with nothing from the primary scale uses the others', () {
    final days = dailyWeighIns([
      weight(82.1, 1, 6, 40),
      weight(84.0, 2, 7, 0, source: 'gym'),
    ], primarySourceId: 'scale');
    expect([for (final d in days) d.kg], [82.1, 84.0]);
    expect(days.last.sourceName, 'Gym scale');
  });

  test('a middle value across two sources says so', () {
    final day = dailyWeighIns([
      weight(82, 1, 13, 0),
      weight(83, 1, 20, 0, source: 'gym'),
    ]).single;
    expect(day.sourceName, 'several sources');
  });

  test('one answer per day, oldest day first, and only weight is read', () {
    final days = dailyWeighIns([
      weight(81.9, 3, 7, 0),
      weight(82.3, 1, 7, 0),
      weight(82.1, 2, 7, 0),
      HealthSample(
        platformId: 'f',
        type: HealthDataType.bodyFat,
        value: 21,
        start: DateTime(2026, 9, 4, 7),
        sourceId: 'scale',
        sourceName: 'Bathroom scale',
      ),
    ]);
    expect([for (final d in days) d.day.day], [1, 2, 3]);
  });

  test('the same readings in any order give the same result', () {
    final readings = [
      weight(82.0, 1, 13, 0),
      weight(82.6, 1, 13, 0, source: 'gym'),
      weight(83.0, 1, 22, 0),
      weight(82.2, 2, 6, 0),
      weight(82.2, 2, 6, 0, source: 'gym'),
      weight(82.9, 2, 9, 0),
    ];
    final forward = dailyWeighIns(readings, primarySourceId: 'gym');
    final backward = dailyWeighIns(
      readings.reversed.toList(),
      primarySourceId: 'gym',
    );
    expect(
      [for (final d in backward) (d.day, d.kg, d.basis, d.sourceName)],
      [for (final d in forward) (d.day, d.kg, d.basis, d.sourceName)],
    );
  });

  group('the primary scale', () {
    final asOf = DateTime(2026, 9, 30, 12);

    test('is the source with the most weigh-ins in the last thirty days', () {
      final samples = [
        for (var d = 1; d <= 10; d++) weight(82, d, 7, 0),
        for (var d = 1; d <= 4; d++) weight(83, d, 18, 0, source: 'gym'),
      ];
      expect(primaryWeightSource(samples, asOf: asOf), 'scale');
      expect(primaryWeightSource(samples.reversed, asOf: asOf), 'scale');
    });

    test('readings older than thirty days do not count toward it', () {
      final samples = [
        for (var d = 1; d <= 10; d++) weight(82, d, 7, 0),
        weight(83, 20, 7, 0, source: 'gym'),
        weight(83, 21, 7, 0, source: 'gym'),
      ];
      expect(primaryWeightSource(samples, asOf: DateTime(2026, 10, 15)), 'gym');
    });

    test('a tie goes to the id that sorts first, whatever the order', () {
      final samples = [weight(82, 1, 7, 0), weight(83, 1, 8, 0, source: 'gym')];
      expect(primaryWeightSource(samples, asOf: asOf), 'gym');
      expect(primaryWeightSource(samples.reversed, asOf: asOf), 'gym');
    });

    test('is none with no weigh-ins', () {
      expect(primaryWeightSource(const [], asOf: asOf), isNull);
    });
  });
}
