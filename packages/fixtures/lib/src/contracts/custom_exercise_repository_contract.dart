import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [CustomExerciseRepository] must do (MM-76).
void customExerciseRepositoryContract(
  String name,
  CustomExerciseRepository Function() create,
) {
  group('$name as a CustomExerciseRepository', () {
    late CustomExerciseRepository repo;

    Exercise exercise(String name, {String id = ''}) => Exercise(
      id: id,
      name: name,
      equipment: Equipment.barbell,
      primary: MuscleGroup.shoulders,
    );

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchCustomExercises().first, isEmpty);
    });

    test('a saved exercise is read back with every field', () async {
      final id = await repo.saveCustomExercise(
        const Exercise(
          id: '',
          name: 'Ring dip',
          equipment: Equipment.other,
          primary: MuscleGroup.chest,
          secondary: [MuscleGroup.triceps, MuscleGroup.shoulders],
          load: ExerciseLoad.bodyweight,
        ),
      );
      expect(id, startsWith(Exercise.customIdPrefix));
      final read = (await repo.watchCustomExercises().first).single;
      expect(read.id, id);
      expect(read.isCustom, isTrue);
      expect(read.name, 'Ring dip');
      expect(read.equipment, Equipment.other);
      expect(read.primary, MuscleGroup.chest);
      expect(read.secondary, [MuscleGroup.triceps, MuscleGroup.shoulders]);
      expect(read.load, ExerciseLoad.bodyweight);
      expect(read.healthConnect, isNull);
    });

    test('an exercise with no secondary muscle groups has none', () async {
      await repo.saveCustomExercise(exercise('Landmine press'));
      final read = (await repo.watchCustomExercises().first).single;
      expect(read.secondary, isEmpty);
      expect(read.load, ExerciseLoad.addedWeight);
    });

    test('lists by name, whatever the capitals', () async {
      await repo.saveCustomExercise(exercise('landmine press'));
      await repo.saveCustomExercise(exercise('Zercher squat'));
      await repo.saveCustomExercise(exercise('Atlas stone'));
      expect(
        [for (final e in await repo.watchCustomExercises().first) e.name],
        ['Atlas stone', 'landmine press', 'Zercher squat'],
      );
    });

    test('each new exercise gets its own id', () async {
      final a = await repo.saveCustomExercise(exercise('A'));
      final b = await repo.saveCustomExercise(exercise('B'));
      expect(a, isNot(b));
    });

    test('saving with an id replaces that exercise', () async {
      final id = await repo.saveCustomExercise(exercise('Landmine pres'));
      final same = await repo.saveCustomExercise(
        exercise('Landmine press', id: id),
      );
      expect(same, id);
      final all = await repo.watchCustomExercises().first;
      expect(all.single.name, 'Landmine press');
      expect(all.single.id, id);
    });

    test('ids are not reused after a delete', () async {
      final first = await repo.saveCustomExercise(exercise('A'));
      await repo.deleteCustomExercise(first);
      expect(await repo.saveCustomExercise(exercise('B')), isNot(first));
    });

    test('deletes an exercise; a missing one is ignored', () async {
      final keep = await repo.saveCustomExercise(exercise('A'));
      final gone = await repo.saveCustomExercise(exercise('B'));
      await repo.deleteCustomExercise(gone);
      await repo.deleteCustomExercise('${Exercise.customIdPrefix}9999');
      await repo.deleteCustomExercise('back-squat');
      expect((await repo.watchCustomExercises().first).single.id, keep);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchCustomExercises().map((all) => all.length),
        before: 0,
        change: () => repo.saveCustomExercise(exercise('A')),
        after: 1,
      );
    });
  });
}
