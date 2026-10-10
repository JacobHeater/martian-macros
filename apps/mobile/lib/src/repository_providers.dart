import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'demo/demo_configuration.dart';
import 'integration_providers.dart';

final demoConfiguration = DemoConfiguration(
  demoApp: const bool.fromEnvironment('MM_DEMO_APP'),
  isAndroid: defaultTargetPlatform == TargetPlatform.android,
  environment: const String.fromEnvironment('MM_ENV', defaultValue: 'dev'),
  seed: const bool.fromEnvironment('MM_DEMO_SEED'),
);

/// Called before building any consumers, so none see a half-seeded history.
Future<void> prepareDemoRepositories(ProviderContainer container) async {
  if (!demoConfiguration.isDemo || !demoConfiguration.seed) return;
  final repositories = container.read(_driftRepositoriesProvider);
  await DemoSeed(container.read(clockProvider).today()).replace(
    eraser: repositories.eraser,
    setup: repositories.setup,
    weights: repositories.weights,
    waist: repositories.waist,
    food: repositories.food,
    dayMarks: repositories.dayMarks,
    targets: repositories.targets,
    recovery: repositories.recovery,
  );
}

/// The one place the app chooses its persistence. Everything else depends on
/// the interfaces below, never on Drift or `mm_data`. Tests override these
/// with fixtures; Android demos use their own persistent database.
final _driftRepositoriesProvider = Provider<DriftRepositories>((ref) {
  final repositories = DriftRepositories(
    AppDatabase(driftDatabase(name: demoConfiguration.databaseName)),
  );
  ref.onDispose(repositories.close);
  return repositories;
});

final setupRepositoryProvider = Provider<SetupRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).setup,
);

final weightRepositoryProvider = Provider<WeightRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).weights,
);

final weightEventRepositoryProvider = Provider<WeightEventRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).weightEvents,
);

final waistRepositoryProvider = Provider<WaistRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).waist,
);

final foodRepositoryProvider = Provider<FoodRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).food,
);

final customFoodRepositoryProvider = Provider<CustomFoodRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).customFoods,
);

final dayMarkRepositoryProvider = Provider<DayMarkRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).dayMarks,
);

final intakeReaderProvider = Provider<IntakeReader>(
  (ref) => ref.watch(_driftRepositoriesProvider).intake,
);

final insightLogRepositoryProvider = Provider<InsightLogRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).insightLog,
);

final pauseRepositoryProvider = Provider<PauseRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).pauses,
);

final reminderRepositoryProvider = Provider<ReminderRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).reminders,
);

final recoveryCheckInRepositoryProvider = Provider<RecoveryCheckInRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).recovery,
);

final targetsHistoryRepositoryProvider = Provider<TargetsHistoryRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).targets,
);

final preferencesRepositoryProvider = Provider<PreferencesRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).preferences,
);

final dataEraserProvider = Provider<DataEraser>(
  (ref) => ref.watch(_driftRepositoriesProvider).eraser,
);
