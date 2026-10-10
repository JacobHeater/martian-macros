import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-76: choosing an exercise, by search and with recent ones first.
void main() {
  List<String> names(
    String query, {
    List<String> recentIds = const [],
    Iterable<Exercise> exercises = builtInExercises,
  }) => [
    for (final e in searchExercises(
      query: query,
      exercises: exercises,
      recentIds: recentIds,
    ))
      e.name,
  ];

  test('"bench" finds the bench presses and their incline variants', () {
    expect(
      names('bench'),
      containsAll([
        'Barbell bench press',
        'Dumbbell bench press',
        'Incline barbell bench press',
        'Incline dumbbell bench press',
      ]),
    );
  });

  test('every word typed must begin a word of the name', () {
    final found = names('inc bench');
    expect(found, isNotEmpty);
    expect(found, everyElement(contains('ncline')));
    expect(found, everyElement(contains('bench')));
  });

  test('it does not matter how it is capitalized or spaced', () {
    expect(names('  BENCH   press '), names('bench press'));
  });

  test('hyphens and apostrophes do not have to be typed', () {
    expect(names('pull up'), contains('Pull-up'));
    expect(names('farmers'), contains("Farmer's carry"));
    expect(names('t bar'), contains('T-bar row'));
  });

  test('names starting with what was typed come before other matches', () {
    final found = names('leg');
    final firstOther = found.indexWhere(
      (name) => !name.toLowerCase().startsWith('leg'),
    );
    final lastStarting = found.lastIndexWhere(
      (name) => name.toLowerCase().startsWith('leg'),
    );
    expect(lastStarting, greaterThanOrEqualTo(0));
    expect(firstOther, greaterThan(lastStarting));
  });

  test('nothing matching is an empty list', () {
    expect(names('zzz'), isEmpty);
  });

  test('with nothing typed, everything is offered, by name', () {
    final found = names('');
    expect(found, hasLength(builtInExercises.length));
    final sorted = [...found]
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    expect(found, sorted);
  });

  test('recently used exercises come first, most recent first', () {
    final found = names('', recentIds: ['back-squat', 'pull-up']);
    expect(found.take(2), ['Back squat', 'Pull-up']);
    expect(found, hasLength(builtInExercises.length));
  });

  test('a recent exercise leads its search results too', () {
    final found = names('press', recentIds: ['leg-press']);
    expect(found.first, 'Leg press');
  });

  test('a recent exercise that does not match is not shown', () {
    expect(
      names('curl', recentIds: ['back-squat']),
      isNot(contains('Back squat')),
    );
  });

  test("the user's own exercises are searched with the library", () {
    const landmine = Exercise(
      id: 'custom-1',
      name: 'Landmine press',
      equipment: Equipment.barbell,
      primary: MuscleGroup.shoulders,
    );
    expect(names('landmine', exercises: [...builtInExercises, landmine]), [
      'Landmine press',
    ]);
  });
}
