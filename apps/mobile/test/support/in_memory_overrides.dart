import 'package:flutter_riverpod/misc.dart';
import 'package:martian_macros/src/repository_providers.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

/// Replaces every repository with its in-memory implementation, so a test
/// runs the real app with no database.
List<Override> inMemoryOverrides(InMemoryRepositories repos) => [
  setupRepositoryProvider.overrideWithValue(repos.setup),
  weightRepositoryProvider.overrideWithValue(repos.weights),
  weightEventRepositoryProvider.overrideWithValue(repos.weightEvents),
  waistRepositoryProvider.overrideWithValue(repos.waist),
  foodRepositoryProvider.overrideWithValue(repos.food),
  customFoodRepositoryProvider.overrideWithValue(repos.customFoods),
  insightLogRepositoryProvider.overrideWithValue(repos.insightLog),
  pauseRepositoryProvider.overrideWithValue(repos.pauses),
  reminderRepositoryProvider.overrideWithValue(repos.reminders),
  dayMarkRepositoryProvider.overrideWithValue(repos.dayMarks),
  intakeReaderProvider.overrideWithValue(repos.intake),
  targetsHistoryRepositoryProvider.overrideWithValue(repos.targets),
  preferencesRepositoryProvider.overrideWithValue(repos.preferences),
  dataEraserProvider.overrideWithValue(repos.eraser),
];
