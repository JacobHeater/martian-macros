import 'package:drift/native.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures_contracts.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';
import 'package:mm_health_ingest/mm_health_ingest_testing.dart';
import 'package:test/test.dart';

/// Runs every repository contract against the Drift implementations. The same
/// suites run against the in-memory ones in packages/fixtures, which is what
/// makes one substitutable for the other.
void main() {
  DriftRepositories open() {
    final repos = DriftRepositories(AppDatabase(NativeDatabase.memory()));
    addTearDown(repos.close);
    return repos;
  }

  setupRepositoryContract('Drift', () => open().setup);
  weightRepositoryContract('Drift', () => open().weights);
  weightEventRepositoryContract('Drift', () => open().weightEvents);
  waistRepositoryContract('Drift', () => open().waist);
  preferencesRepositoryContract('Drift', () => open().preferences);
  foodRepositoryContract('Drift', () => open().food);
  customFoodRepositoryContract('Drift', () => open().customFoods);
  dayMarkRepositoryContract('Drift', () => open().dayMarks);
  targetsHistoryRepositoryContract('Drift', () => open().targets);
  insightLogRepositoryContract('Drift', () => open().insightLog);
  pauseRepositoryContract('Drift', () => open().pauses);
  reminderRepositoryContract('Drift', () => open().reminders);
  recoveryCheckInRepositoryContract('Drift', () => open().recovery);
  workoutRepositoryContract('Drift', () => open().workouts);
  customExerciseRepositoryContract('Drift', () => open().customExercises);
  exerciseProgressionRepositoryContract(
    'Drift',
    () => open().exerciseProgressions,
  );

  test('erasing empties the rep ranges and load steps', () async {
    final repos = open();
    await repos.exerciseProgressions.saveExerciseProgression(
      const ExerciseProgression(
        exerciseId: 'back-squat',
        repsLow: 3,
        repsHigh: 6,
      ),
    );
    await repos.eraser.eraseAll();
    expect(
      await repos.exerciseProgressions.watchExerciseProgressions().first,
      isEmpty,
    );
  });
  healthSampleStoreContract('Drift', () => open().healthSamples);

  test('importing into the database twice does not duplicate, and erasing '
      'empties it', () async {
    final repos = open();
    final source = FakeHealthSource.fromJson(
      recordedHealthHistory,
      happened: 9,
    );
    await source.permit();
    final importer = HealthImporter(source: source, store: repos.healthSamples);
    await importer.import(HealthDataType.weight);
    source.letAllHappen();
    await importer.import(HealthDataType.weight);
    await importer.import(HealthDataType.weight);
    expect(
      [
        for (final s in await repos.healthSamples.samples(
          HealthDataType.weight,
        ))
          s.platformId,
      ],
      ['w-1', 'w-3', 'w-4', 'w-5', 'w-6'],
    );

    await repos.eraser.eraseAll();
    expect(await repos.healthSamples.samples(HealthDataType.weight), isEmpty);
    expect(await repos.healthSamples.token(HealthDataType.weight), isNull);
  });

  intakeReaderContract('Drift', () {
    final r = open();
    return (food: r.food, marks: r.dayMarks, intake: r.intake);
  });
  dataEraserContract('Drift', () {
    final r = open();
    return (
      eraser: r.eraser,
      setup: r.setup,
      weights: r.weights,
      weightEvents: r.weightEvents,
      food: r.food,
      targets: r.targets,
      preferences: r.preferences,
      workouts: r.workouts,
      customExercises: r.customExercises,
    );
  });
}
