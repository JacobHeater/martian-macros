import 'package:drift/native.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_fixtures/mm_fixtures_contracts.dart';
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
    );
  });
}
