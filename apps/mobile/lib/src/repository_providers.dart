import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// The one place the app chooses its persistence. Everything else depends on
/// the interfaces below, never on Drift or `mm_data`. Tests (and demo builds)
/// override these with `InMemoryRepositories` from `mm_fixtures`.
final _driftRepositoriesProvider = Provider<DriftRepositories>((ref) {
  final repositories = DriftRepositories(
    AppDatabase(driftDatabase(name: 'martian_macros')),
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

final targetsHistoryRepositoryProvider = Provider<TargetsHistoryRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).targets,
);

final preferencesRepositoryProvider = Provider<PreferencesRepository>(
  (ref) => ref.watch(_driftRepositoriesProvider).preferences,
);

final dataEraserProvider = Provider<DataEraser>(
  (ref) => ref.watch(_driftRepositoriesProvider).eraser,
);
