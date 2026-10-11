import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-32: whether four weeks look like a recomp from outside.
void main() {
  final today = CalendarDate(2026, 10, 11);
  final squat = builtInExercises.firstWhere((e) => e.id == 'back-squat');

  /// A trend from [fromKg] 28 days ago to [toKg] today, a point a day.
  List<WeightTrendPoint> trend(double fromKg, double toKg) => [
    for (var daysAgo = 40; daysAgo >= 0; daysAgo--)
      WeightTrendPoint(
        date: today.addDays(-daysAgo),
        levelKg: daysAgo >= 28
            ? fromKg
            : fromKg + (toKg - fromKg) * (28 - daysAgo) / 28,
        slopeKgPerDay: 0,
        waterKg: 0,
        levelVariance: 0.04,
        slopeVariance: 0.0001,
        observed: true,
        rejected: false,
      ),
  ];

  List<WeightObservation> weighedOn(Iterable<int> daysAgo) => [
    for (final d in daysAgo)
      WeightObservation(date: today.addDays(-d), weightKg: 82),
  ];
  final daily = weighedOn([for (var d = 0; d <= 35; d++) d]);

  List<WaistObservation> waistOn(Map<int, double> byDaysAgo) => [
    for (final entry in byDaysAgo.entries)
      WaistObservation(date: today.addDays(-entry.key), waistCm: entry.value),
  ];

  /// A lift trained weekly, its smoothed max going from [fromKg] 28 days
  /// before its last session to [toKg] at it.
  StrengthTrend lift(
    String name,
    double fromKg,
    double toKg, {
    int lastDaysAgo = 1,
    int sessions = 6,
  }) => StrengthTrend(
    exercise: Exercise(
      id: name,
      name: name,
      equipment: squat.equipment,
      primary: squat.primary,
    ),
    exerciseId: name,
    loggedSessions: sessions,
    recentSessions: sessions,
    points: [
      for (var i = sessions - 1; i >= 0; i--)
        StrengthPoint(
          workoutId: i + 1,
          date: today.addDays(-lastDaysAgo - i * 7),
          estimateKg: i >= 4 ? fromKg : fromKg + (toKg - fromKg) * (4 - i) / 4,
          trendKg: i >= 4 ? fromKg : fromKg + (toKg - fromKg) * (4 - i) / 4,
        ),
    ],
  );

  final waistDown = waistOn({30: 92, 24: 92.5, 10: 90.5, 3: 90});
  final liftsUp = [lift('Back squat', 100, 106), lift('Barbell row', 60, 63)];

  RecompSignal read({
    List<WeightTrendPoint>? trendPoints,
    List<WeightObservation>? weights,
    List<WaistObservation>? waist,
    List<StrengthTrend>? lifts,
  }) => recompSignalOf(
    trend: trendPoints ?? trend(82, 82.2),
    weights: weights ?? daily,
    waist: waist ?? waistDown,
    strengthTrends: lifts ?? liftsUp,
    today: today,
  );

  test('weight flat, waist down and two lifts up: the signal is there', () {
    final signal = read();
    expect(signal.present, isTrue);
    expect(signal.onlyMissing, isNull);
    expect(signal.trendWeightKg, closeTo(82.2, 1e-9));
    expect(signal.waistChangeCm, closeTo(-2, 1e-9));
    expect(signal.liftsUp, ['Back squat', 'Barbell row']);
  });

  group('weight', () {
    test('down 2% is not flat: that is fat loss, and no signal', () {
      final signal = read(trendPoints: trend(82, 80.36));
      expect(signal.weight, RecompPart.doesNotHold);
      expect(signal.present, isFalse);
      expect(signal.onlyMissing, isNull);
    });

    test('moved by exactly half a percent is not flat', () {
      expect(read(trendPoints: trend(80, 80.4)).weight, RecompPart.doesNotHold);
      expect(read(trendPoints: trend(80, 80.39)).weight, RecompPart.holds);
    });

    test('is unknown on six weigh-ins in four weeks', () {
      final signal = read(weights: weighedOn([0, 1, 9, 17, 27, 29]));
      expect(signal.weight, RecompPart.unknown);
      expect(signal.onlyMissing, RecompMeasure.weight);
    });

    test('is unknown with none in the last week, or none four weeks ago', () {
      expect(
        read(weights: weighedOn([for (var d = 8; d <= 35; d++) d])).weight,
        RecompPart.unknown,
      );
      expect(
        read(weights: weighedOn([for (var d = 0; d <= 20; d++) d])).weight,
        RecompPart.unknown,
      );
    });
  });

  group('waist', () {
    test('down 1.25 cm between two pairs is not clearly down', () {
      final signal = read(waist: waistOn({30: 92, 24: 93, 10: 91, 3: 91.5}));
      expect(signal.waist, RecompPart.doesNotHold);
      expect(signal.waistChangeCm, closeTo(-1.25, 1e-9));
      expect(signal.present, isFalse);
    });

    test('down 1.5 cm between two pairs is down', () {
      expect(
        read(waist: waistOn({30: 92, 24: 93, 10: 91, 3: 91})).waist,
        RecompPart.holds,
      );
    });

    test('one reading at either end needs 2 cm', () {
      expect(
        read(waist: waistOn({28: 92, 10: 90.2, 3: 90.2})).waist,
        RecompPart.doesNotHold,
      );
      expect(
        read(waist: waistOn({28: 92, 10: 90, 3: 90})).waist,
        RecompPart.holds,
      );
    });

    test('up is not a prompt to measure: it was measured', () {
      final signal = read(waist: waistOn({30: 90, 24: 90, 10: 92, 3: 92}));
      expect(signal.waist, RecompPart.doesNotHold);
      expect(signal.onlyMissing, isNull);
    });

    test('is unknown with no entries, or two, or none at one end', () {
      expect(read(waist: const []).waist, RecompPart.unknown);
      expect(read(waist: const []).onlyMissing, RecompMeasure.waist);
      expect(read(waist: waistOn({28: 92, 3: 90})).waist, RecompPart.unknown);
      expect(
        read(waist: waistOn({12: 92, 8: 91, 3: 90})).waist,
        RecompPart.unknown,
      );
    });

    test('the windows are the last 14 days and 21 to 35 days ago', () {
      // 13 days ago is recent; 14 is in neither window.
      expect(
        read(waist: waistOn({35: 92, 21: 92, 13: 90})).waist,
        RecompPart.holds,
      );
      expect(
        read(waist: waistOn({35: 92, 21: 92, 14: 90})).waist,
        RecompPart.unknown,
      );
      expect(
        read(waist: waistOn({36: 92, 20: 92, 13: 90, 3: 90})).waist,
        RecompPart.unknown,
      );
    });
  });

  group('strength', () {
    test('one lift up is not enough', () {
      final signal = read(
        lifts: [lift('Back squat', 100, 106), lift('Barbell row', 60, 60.5)],
      );
      expect(signal.strength, RecompPart.doesNotHold);
      expect(signal.present, isFalse);
    });

    test('up by exactly 2.5% counts, and less does not', () {
      expect(
        read(
          lifts: [lift('Back squat', 100, 102.5), lift('Barbell row', 80, 82)],
        ).strength,
        RecompPart.holds,
      );
      expect(
        read(
          lifts: [lift('Back squat', 100, 102.4), lift('Barbell row', 80, 82)],
        ).strength,
        RecompPart.doesNotHold,
      );
    });

    test('two up and two down is not up', () {
      expect(
        read(
          lifts: [
            lift('Back squat', 100, 106),
            lift('Barbell row', 60, 63),
            lift('Bench', 80, 76),
            lift('Press', 50, 47),
          ],
        ).strength,
        RecompPart.doesNotHold,
      );
    });

    test('a lift not trained for 20 days is not counted', () {
      final signal = read(
        lifts: [
          lift('Back squat', 100, 106),
          lift('Barbell row', 60, 63, lastDaysAgo: 20),
        ],
      );
      expect(signal.strength, RecompPart.unknown);
      expect(signal.onlyMissing, RecompMeasure.strength);
    });

    test('a lift with three sessions in six weeks is not counted', () {
      expect(
        read(
          lifts: [
            lift('Back squat', 100, 106),
            lift('Barbell row', 60, 63, sessions: 3),
          ],
        ).strength,
        RecompPart.unknown,
      );
    });

    test('is unknown with no training logged', () {
      final signal = read(lifts: const []);
      expect(signal.strength, RecompPart.unknown);
      expect(signal.onlyMissing, RecompMeasure.strength);
    });
  });

  test('two parts unknown is nothing to prompt for', () {
    expect(read(waist: const [], lifts: const []).onlyMissing, isNull);
  });
}
