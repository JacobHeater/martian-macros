import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [ExerciseProgressionRepository] must do (MM-79).
void exerciseProgressionRepositoryContract(
  String name,
  ExerciseProgressionRepository Function() create,
) {
  group('$name as an ExerciseProgressionRepository', () {
    late ExerciseProgressionRepository repo;
    const squat = ExerciseProgression(
      exerciseId: 'back-squat',
      repsLow: 3,
      repsHigh: 6,
      loadStepKg: 5,
    );
    const curl = ExerciseProgression(
      exerciseId: 'custom-1',
      repsLow: 10,
      repsHigh: 15,
    );

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchExerciseProgressions().first, isEmpty);
    });

    test(
      'what is saved is read back with every field, by exercise id',
      () async {
        await repo.saveExerciseProgression(curl);
        await repo.saveExerciseProgression(squat);
        expect(await repo.watchExerciseProgressions().first, [squat, curl]);
      },
    );

    test('saving for the same exercise again replaces it', () async {
      await repo.saveExerciseProgression(squat);
      const changed = ExerciseProgression(
        exerciseId: 'back-squat',
        repsLow: 5,
        repsHigh: 8,
      );
      await repo.saveExerciseProgression(changed);
      final only = (await repo.watchExerciseProgressions().first).single;
      expect(only, changed);
      expect(only.loadStepKg, isNull);
    });

    test('clearing goes back to none for that exercise only, and clearing '
        'what is not set does nothing', () async {
      await repo.saveExerciseProgression(squat);
      await repo.saveExerciseProgression(curl);
      await repo.clearExerciseProgression('back-squat');
      await repo.clearExerciseProgression('never-set');
      expect(await repo.watchExerciseProgressions().first, [curl]);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchExerciseProgressions().map((l) => l.length),
        before: 0,
        change: () => repo.saveExerciseProgression(squat),
        after: 1,
      );
    });
  });
}
