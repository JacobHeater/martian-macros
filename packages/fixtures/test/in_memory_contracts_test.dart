import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_fixtures/mm_fixtures_contracts.dart';

/// Runs every repository contract against the in-memory implementations. The
/// Drift implementations run the same suites in packages/data.
void main() {
  setupRepositoryContract('In-memory', () => InMemoryRepositories().setup);
  weightRepositoryContract('In-memory', () => InMemoryRepositories().weights);
  weightEventRepositoryContract(
    'In-memory',
    () => InMemoryRepositories().weightEvents,
  );
  waistRepositoryContract('In-memory', () => InMemoryRepositories().waist);
  preferencesRepositoryContract(
    'In-memory',
    () => InMemoryRepositories().preferences,
  );
  foodRepositoryContract('In-memory', () => InMemoryRepositories().food);
  customFoodRepositoryContract(
    'In-memory',
    () => InMemoryRepositories().customFoods,
  );
  dayMarkRepositoryContract('In-memory', () => InMemoryRepositories().dayMarks);
  targetsHistoryRepositoryContract(
    'In-memory',
    () => InMemoryRepositories().targets,
  );
  insightLogRepositoryContract(
    'In-memory',
    () => InMemoryRepositories().insightLog,
  );
  intakeReaderContract('In-memory', () {
    final r = InMemoryRepositories();
    return (food: r.food, marks: r.dayMarks, intake: r.intake);
  });
  dataEraserContract('In-memory', () {
    final r = InMemoryRepositories();
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
