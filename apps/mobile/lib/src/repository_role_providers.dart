import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'repository_providers.dart';

// Already single-role: re-exported so a screen imports this file only and
// never the registration file that knows Drift.
export 'repository_providers.dart'
    show dataEraserProvider, intakeReaderProvider;

// Narrow views of the repositories. A screen that only shows weights asks for
// a WeightReader and cannot call anything else (interface segregation).

final setupReaderProvider = Provider<SetupReader>(
  (ref) => ref.watch(setupRepositoryProvider),
);

final setupWriterProvider = Provider<SetupWriter>(
  (ref) => ref.watch(setupRepositoryProvider),
);

final preferencesReaderProvider = Provider<PreferencesReader>(
  (ref) => ref.watch(preferencesRepositoryProvider),
);

final preferencesWriterProvider = Provider<PreferencesWriter>(
  (ref) => ref.watch(preferencesRepositoryProvider),
);

final weightReaderProvider = Provider<WeightReader>(
  (ref) => ref.watch(weightRepositoryProvider),
);

final weightWriterProvider = Provider<WeightWriter>(
  (ref) => ref.watch(weightRepositoryProvider),
);

final weightEventReaderProvider = Provider<WeightEventReader>(
  (ref) => ref.watch(weightEventRepositoryProvider),
);

final weightEventWriterProvider = Provider<WeightEventWriter>(
  (ref) => ref.watch(weightEventRepositoryProvider),
);

final waistReaderProvider = Provider<WaistReader>(
  (ref) => ref.watch(waistRepositoryProvider),
);

final waistWriterProvider = Provider<WaistWriter>(
  (ref) => ref.watch(waistRepositoryProvider),
);

final foodDayReaderProvider = Provider<FoodDayReader>(
  (ref) => ref.watch(foodRepositoryProvider),
);

final recentFoodReaderProvider = Provider<RecentFoodReader>(
  (ref) => ref.watch(foodRepositoryProvider),
);

final foodEntryWriterProvider = Provider<FoodEntryWriter>(
  (ref) => ref.watch(foodRepositoryProvider),
);

final dayMarkReaderProvider = Provider<DayMarkReader>(
  (ref) => ref.watch(dayMarkRepositoryProvider),
);

final dayMarkWriterProvider = Provider<DayMarkWriter>(
  (ref) => ref.watch(dayMarkRepositoryProvider),
);

final targetsHistoryReaderProvider = Provider<TargetsHistoryReader>(
  (ref) => ref.watch(targetsHistoryRepositoryProvider),
);

final targetsHistoryWriterProvider = Provider<TargetsHistoryWriter>(
  (ref) => ref.watch(targetsHistoryRepositoryProvider),
);
