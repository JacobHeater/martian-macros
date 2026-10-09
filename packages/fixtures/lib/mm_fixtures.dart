/// Working in-memory implementations of every repository interface, and
/// builders for typical data. Used by tests, the component gallery, demo
/// builds and early feature work that must not wait on a real provider.
library;

export 'src/fixed_clock.dart';
export 'src/in_memory_backup_storage.dart';
export 'src/in_memory_data_eraser.dart';
export 'src/in_memory_day_mark_repository.dart';
export 'src/in_memory_entitlement.dart';
export 'src/in_memory_food_catalog.dart';
export 'src/in_memory_food_repository.dart';
export 'src/in_memory_intake_reader.dart';
export 'src/in_memory_preferences_repository.dart';
export 'src/in_memory_repositories.dart';
export 'src/in_memory_setup_repository.dart';
export 'src/in_memory_targets_history_repository.dart';
export 'src/in_memory_waist_repository.dart';
export 'src/in_memory_weight_event_repository.dart';
export 'src/in_memory_weight_repository.dart';
export 'src/typical_setup.dart';
