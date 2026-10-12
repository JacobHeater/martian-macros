import 'package:flutter_test/flutter_test.dart';
import 'package:health/health.dart' as plugin;
import 'package:martian_macros/src/health/health_connect_sample.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

/// MM-68: a Health Connect reading as the app keeps it.
void main() {
  plugin.HealthDataPoint point(
    plugin.HealthDataType type,
    plugin.HealthValue value, {
    plugin.HealthDataUnit unit = plugin.HealthDataUnit.KILOGRAM,
    DateTime? from,
    DateTime? to,
    String sourceName = 'Bathroom scale',
  }) => plugin.HealthDataPoint(
    uuid: 'abc-123',
    value: value,
    type: type,
    unit: unit,
    dateFrom: from ?? DateTime(2026, 9, 1, 7, 2),
    dateTo: to ?? from ?? DateTime(2026, 9, 1, 7, 2),
    sourcePlatform: plugin.HealthPlatformType.googleHealthConnect,
    sourceDeviceId: 'device',
    sourceId: 'com.example.scale',
    sourceName: sourceName,
  );

  plugin.NumericHealthValue number(num n) =>
      plugin.NumericHealthValue(numericValue: n);

  test('a weight keeps its value, time, id and source', () {
    final sample = healthConnectSample(
      point(plugin.HealthDataType.WEIGHT, number(82.4)),
    )!;
    expect(sample.type, HealthDataType.weight);
    expect(sample.value, 82.4);
    expect(sample.platformId, 'abc-123');
    expect(sample.start, DateTime(2026, 9, 1, 7, 2));
    expect(sample.end, isNull);
    expect(sample.sourceId, 'com.example.scale');
    expect(sample.sourceName, 'Bathroom scale');
  });

  test('a source with no name is shown by its id', () {
    final sample = healthConnectSample(
      point(plugin.HealthDataType.WEIGHT, number(82.4), sourceName: ''),
    )!;
    expect(sample.sourceName, 'com.example.scale');
  });

  test('height arrives in meters and is kept in centimeters', () {
    final sample = healthConnectSample(
      point(
        plugin.HealthDataType.HEIGHT,
        number(1.78),
        unit: plugin.HealthDataUnit.METER,
      ),
    )!;
    expect(sample.type, HealthDataType.height);
    expect(sample.value, closeTo(178, 1e-9));
  });

  test('body fat, lean mass and steps keep their number', () {
    expect(
      healthConnectSample(
        point(plugin.HealthDataType.BODY_FAT_PERCENTAGE, number(21.4)),
      )!.type,
      HealthDataType.bodyFat,
    );
    expect(
      healthConnectSample(
        point(plugin.HealthDataType.LEAN_BODY_MASS, number(64)),
      )!.value,
      64,
    );
    final steps = healthConnectSample(
      point(
        plugin.HealthDataType.STEPS,
        number(8421),
        from: DateTime(2026, 9, 2),
        to: DateTime(2026, 9, 3),
      ),
    )!;
    expect(steps.value, 8421);
    expect(steps.end, DateTime(2026, 9, 3));
  });

  test('a workout is kept as its length in minutes', () {
    final sample = healthConnectSample(
      point(
        plugin.HealthDataType.WORKOUT,
        plugin.WorkoutHealthValue(
          workoutActivityType: plugin.HealthWorkoutActivityType.WEIGHTLIFTING,
        ),
        from: DateTime(2026, 9, 2, 18),
        to: DateTime(2026, 9, 2, 18, 55),
      ),
    )!;
    expect(sample.type, HealthDataType.workout);
    expect(sample.value, 55);
    expect(sample.end, DateTime(2026, 9, 2, 18, 55));
  });

  test('a kind of reading the app does not import is left out', () {
    expect(
      healthConnectSample(point(plugin.HealthDataType.HEART_RATE, number(60))),
      isNull,
    );
  });

  test('every kind the app reads has a Health Connect kind', () {
    expect(healthConnectTypes.keys.toSet(), HealthDataType.values.toSet());
  });
}
