import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_fixtures/mm_fixtures_contracts.dart';

/// Runs every repository contract against the in-memory implementations. The
/// Drift implementations run the same suites in packages/data.
void main() {
  setupRepositoryContract('In-memory', () => InMemoryRepositories().setup);
  weightRepositoryContract('In-memory', () => InMemoryRepositories().weights);
  waistRepositoryContract('In-memory', () => InMemoryRepositories().waist);
  foodRepositoryContract('In-memory', () => InMemoryRepositories().food);
  dayMarkRepositoryContract('In-memory', () => InMemoryRepositories().dayMarks);
  targetsHistoryRepositoryContract(
    'In-memory',
    () => InMemoryRepositories().targets,
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
      food: r.food,
      targets: r.targets,
    );
  });
}
