import 'dart:io';

import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-76 and MM-189: the built-in exercise library and how it lines up with
/// what Health Connect can name.
void main() {
  Exercise named(String name) =>
      builtInExercises.singleWhere((e) => e.name == name);

  group('the library', () {
    test('has about 150 exercises', () {
      expect(builtInExercises.length, inInclusiveRange(140, 170));
    });

    test('has no two exercises with the same id or name', () {
      final ids = {for (final e in builtInExercises) e.id};
      final names = {for (final e in builtInExercises) e.name.toLowerCase()};
      expect(ids, hasLength(builtInExercises.length));
      expect(names, hasLength(builtInExercises.length));
    });

    test('gives every exercise an id that is safe to store', () {
      for (final e in builtInExercises) {
        expect(
          e.id,
          matches(RegExp(r'^[a-z0-9]+(-[a-z0-9]+)*$')),
          reason: e.id,
        );
      }
    });

    test('never lists the primary muscle group as a secondary one', () {
      for (final e in builtInExercises) {
        expect(e.secondary, isNot(contains(e.primary)), reason: e.name);
        expect(e.secondary.toSet(), hasLength(e.secondary.length));
      }
    });

    test('has several exercises for every muscle group', () {
      for (final group in MuscleGroup.values) {
        final count = builtInExercises.where((e) => e.primary == group).length;
        expect(count, greaterThanOrEqualTo(4), reason: group.name);
      }
    });

    test('has every kind of equipment', () {
      expect({
        for (final e in builtInExercises) e.equipment,
      }, Equipment.values.toSet());
    });

    test('records bodyweight exercises as loaded by bodyweight', () {
      expect(named('Pull-up').load, ExerciseLoad.bodyweight);
      expect(named('Push-up').load, ExerciseLoad.bodyweight);
      expect(named('Barbell bench press').load, ExerciseLoad.addedWeight);
    });

    test('says what the bench press trains (MM-78)', () {
      final bench = named('Barbell bench press');
      expect(bench.primary, MuscleGroup.chest);
      expect(bench.secondary, [MuscleGroup.shoulders, MuscleGroup.triceps]);
    });
  });

  group('lining up with Health Connect', () {
    test('a movement the platform names carries its type', () {
      expect(
        named('Barbell bench press').healthConnect,
        HealthConnectSegment.benchPress,
      );
      expect(named('Back squat').healthConnect, HealthConnectSegment.squat);
      expect(named('Deadlift').healthConnect, HealthConnectSegment.deadlift);
      expect(named('Pull-up').healthConnect, HealthConnectSegment.pullUp);
    });

    test('a variant carries its movement\'s type', () {
      expect(
        named('Incline dumbbell bench press').healthConnect,
        HealthConnectSegment.benchPress,
      );
      expect(named('Chin-up').healthConnect, HealthConnectSegment.pullUp);
    });

    test('a movement it does not name has none, and is never the nearest', () {
      // The fallback list of MM-188.
      for (final name in [
        'Push-up',
        'Dip',
        'Barbell row',
        'Seated cable row',
        'T-bar row',
        'Dumbbell fly',
        'Pec deck',
        'Cable crossover',
        'Face pull',
        'Dumbbell reverse fly',
        'Barbell shrug',
        'Dumbbell pullover',
        'Triceps pushdown',
        'Skull crusher',
        'Standing calf raise',
        'Glute bridge',
        'Good morning',
        'Hip abduction',
        'Split squat',
        'Bulgarian split squat',
        'Step-up',
        'Hack squat',
        "Farmer's carry",
        'Ab wheel rollout',
        'Russian twist',
        'Pallof press',
        'Wrist curl',
      ]) {
        expect(named(name).healthConnect, isNull, reason: name);
      }
    });

    test(
      'the types that record a side, or duplicate another, are not used',
      () {
        // MM-188: the log does not record a side, and the library uses the
        // two-arm dumbbell triceps extension, not its duplicate.
        const unused = {
          HealthConnectSegment.dumbbellCurlLeftArm,
          HealthConnectSegment.dumbbellCurlRightArm,
          HealthConnectSegment.dumbbellTricepsExtensionLeftArm,
          HealthConnectSegment.dumbbellTricepsExtensionRightArm,
          HealthConnectSegment.doubleArmTricepsExtension,
          HealthConnectSegment.forwardTwist,
          HealthConnectSegment.hulaHoop,
          HealthConnectSegment.punch,
          HealthConnectSegment.upperTwist,
        };
        final used = {
          for (final e in builtInExercises)
            if (e.healthConnect != null) e.healthConnect!,
        };
        expect(used.intersection(unused), isEmpty);
        expect(used, HealthConnectSegment.values.toSet().difference(unused));
      },
    );

    test('every identifier is the one checked in MM-188', () {
      // The ticket's table was checked by script against the client
      // library's source. This keeps the code from drifting from it.
      final ticket = File(
        '../../requirements/health-sync/'
        'SPIKE.what-exercises-the-platforms-can-name.MM-188.md',
      ).readAsStringSync();
      final checked = {
        for (final row in RegExp(
          r'^\| `([A-Z_]+)` \| (\d+) \|',
          multiLine: true,
        ).allMatches(ticket))
          row.group(1)!: int.parse(row.group(2)!),
      };
      expect(checked, hasLength(42));
      expect({
        for (final s in HealthConnectSegment.values)
          s.platformName: s.platformId,
      }, checked);
    });
  });
}
