import 'package:mm_domain/mm_domain.dart';

/// Starts, changes and finishes workouts (MM-75). Every change is saved at
/// once, so a workout survives the app closing mid-session.
final class WorkoutController {
  const WorkoutController({required this.workouts, required this.clock});

  final WorkoutWriter workouts;
  final Clock clock;

  /// Starts a workout now. With [from], it starts with that workout's
  /// exercises and their rest targets, and no sets. Returns its id.
  Future<int> start({Workout? from}) => workouts.saveWorkout(
    Workout(
      id: 0,
      date: clock.today(),
      startedAt: clock.now(),
      exercises: [
        for (final exercise in from?.exercises ?? const <WorkoutExercise>[])
          WorkoutExercise(
            exerciseId: exercise.exerciseId,
            restTarget: exercise.restTarget,
          ),
      ],
    ),
  );

  /// Ends the workout now. A pause still running ends with it.
  Future<void> finish(Workout workout) {
    final now = clock.now();
    return workouts.saveWorkout(
      _resumed(
        workout,
        now,
      ).copyWith(endedAt: () => now, setStartedAt: () => null),
    );
  }

  /// Stops the workout's clock until it is resumed (MM-191). A set being
  /// timed is dropped: a pause is not part of a set.
  Future<void> pause(Workout workout) {
    if (workout.paused || !workout.inProgress) return Future.value();
    return workouts.saveWorkout(
      workout.copyWith(pausedAt: clock.now, setStartedAt: () => null),
    );
  }

  /// Starts the clock again; the time paused is left out of the workout.
  Future<void> resume(Workout workout) =>
      workouts.saveWorkout(_resumed(workout, clock.now()));

  static Workout _resumed(Workout workout, DateTime now) {
    final pausedAt = workout.pausedAt;
    if (pausedAt == null) return workout;
    return workout.copyWith(
      pausedAt: () => null,
      pausedFor: workout.pausedFor + now.difference(pausedAt),
    );
  }

  /// Starts timing a set (MM-191). The next set added takes this as its
  /// start.
  Future<void> startSet(Workout workout) =>
      workouts.saveWorkout(workout.copyWith(setStartedAt: clock.now));

  /// Stops the set timer without logging a set.
  Future<void> cancelSet(Workout workout) =>
      workouts.saveWorkout(workout.copyWith(setStartedAt: () => null));

  /// Sets a workout's day, start and end by hand (MM-191). The caller has
  /// checked that they make sense.
  Future<void> setTimes(
    Workout workout, {
    required CalendarDate date,
    required DateTime startedAt,
    required DateTime? endedAt,
  }) {
    // Typed times are the truth: pauses longer than the workout they now
    // describe are dropped.
    final span = (endedAt ?? clock.now()).difference(startedAt);
    return workouts.saveWorkout(
      workout.copyWith(
        date: date,
        startedAt: startedAt,
        endedAt: () => endedAt,
        pausedFor: workout.pausedFor > span ? Duration.zero : null,
      ),
    );
  }

  /// Starts a workout in progress again from now, for one opened before
  /// the training began.
  Future<void> restartClock(Workout workout) => workouts.saveWorkout(
    workout.copyWith(
      date: clock.today(),
      startedAt: clock.now(),
      pausedAt: () => null,
      pausedFor: Duration.zero,
    ),
  );

  Future<void> delete(Workout workout) => workouts.deleteWorkout(workout.id);

  /// Adds an exercise, with the rest target it had last, if any.
  Future<void> addExercise(
    Workout workout,
    String exerciseId, {
    Duration? restTarget,
  }) => workouts.saveWorkout(
    workout.copyWith(
      exercises: [
        ...workout.exercises,
        WorkoutExercise(exerciseId: exerciseId, restTarget: restTarget),
      ],
    ),
  );

  /// Sets how long the user means to rest after a set of the exercise at
  /// [index] (MM-191), or none. A rest already running is measured against
  /// it from when that rest began.
  Future<void> setRestTarget(Workout workout, int index, Duration? target) =>
      workouts.saveWorkout(
        workout.copyWith(
          exercises: [
            for (var i = 0; i < workout.exercises.length; i++)
              i == index
                  ? workout.exercises[i].withRestTarget(target)
                  : workout.exercises[i],
          ],
        ),
      );

  Future<void> removeExercise(Workout workout, int index) =>
      workouts.saveWorkout(
        workout.copyWith(
          exercises: [
            for (var i = 0; i < workout.exercises.length; i++)
              if (i != index) workout.exercises[i],
          ],
        ),
      );

  /// Adds a set to the exercise at [index]: a copy of its previous set, or
  /// else of [lastTime], the first set of the last session, or else an empty
  /// one. Reps in reserve are not copied; they are a judgment of one set.
  ///
  /// In a workout in progress the set ends now, and began when the set
  /// timer was started, if it was (MM-191). A set added to a finished
  /// workout has no times; none are invented.
  Future<void> addSet(Workout workout, int index, {WorkoutSet? lastTime}) {
    final sets = workout.exercises[index].sets;
    final like = sets.lastOrNull ?? lastTime;
    return _withSets(workout.copyWith(setStartedAt: () => null), index, [
      ...sets,
      WorkoutSet(
        reps: like?.reps ?? 0,
        loadKg: like?.loadKg ?? 0,
        startedAt: workout.inProgress ? workout.setStartedAt : null,
        endedAt: workout.inProgress ? clock.now() : null,
      ),
    ]);
  }

  Future<void> updateSet(
    Workout workout,
    int index,
    int setIndex,
    WorkoutSet set,
  ) {
    final sets = workout.exercises[index].sets;
    return _withSets(workout, index, [
      for (var i = 0; i < sets.length; i++) i == setIndex ? set : sets[i],
    ]);
  }

  Future<void> removeSet(Workout workout, int index, int setIndex) {
    final sets = workout.exercises[index].sets;
    return _withSets(workout, index, [
      for (var i = 0; i < sets.length; i++)
        if (i != setIndex) sets[i],
    ]);
  }

  Future<void> _withSets(Workout workout, int index, List<WorkoutSet> sets) =>
      workouts.saveWorkout(
        workout.copyWith(
          exercises: [
            for (var i = 0; i < workout.exercises.length; i++)
              i == index
                  ? workout.exercises[i].withSets(sets)
                  : workout.exercises[i],
          ],
        ),
      );
}
