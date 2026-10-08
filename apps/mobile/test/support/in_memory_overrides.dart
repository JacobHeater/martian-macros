import 'package:flutter_riverpod/misc.dart';
import 'package:martian_macros/src/repository_providers.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

/// Replaces every repository with its in-memory implementation, so a test
/// runs the real app with no database.
List<Override> inMemoryOverrides(InMemoryRepositories repos) => [
  setupRepositoryProvider.overrideWithValue(repos.setup),
  weightRepositoryProvider.overrideWithValue(repos.weights),
  waistRepositoryProvider.overrideWithValue(repos.waist),
  foodRepositoryProvider.overrideWithValue(repos.food),
  dayMarkRepositoryProvider.overrideWithValue(repos.dayMarks),
  intakeReaderProvider.overrideWithValue(repos.intake),
  targetsHistoryRepositoryProvider.overrideWithValue(repos.targets),
  preferencesRepositoryProvider.overrideWithValue(repos.preferences),
  dataEraserProvider.overrideWithValue(repos.eraser),
];
