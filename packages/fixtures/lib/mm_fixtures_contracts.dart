/// Contract test suites: one per interface, run against every implementation
/// (the Drift one and the in-memory one) so that substituting one for the
/// other cannot change behavior. Depends on package:test.
library;

export 'src/contracts/backup_storage_contract.dart';
export 'src/contracts/clock_contract.dart';
export 'src/contracts/custom_food_repository_contract.dart';
export 'src/contracts/data_eraser_contract.dart';
export 'src/contracts/day_mark_repository_contract.dart';
export 'src/contracts/entitlement_reader_contract.dart';
export 'src/contracts/food_barcode_lookup_contract.dart';
export 'src/contracts/food_repository_contract.dart';
export 'src/contracts/food_search_contract.dart';
export 'src/contracts/insight_log_repository_contract.dart';
export 'src/contracts/intake_reader_contract.dart';
export 'src/contracts/pause_repository_contract.dart';
export 'src/contracts/preferences_repository_contract.dart';
export 'src/contracts/recovery_check_in_repository_contract.dart';
export 'src/contracts/reminder_repository_contract.dart';
export 'src/contracts/setup_repository_contract.dart';
export 'src/contracts/targets_history_repository_contract.dart';
export 'src/contracts/waist_repository_contract.dart';
export 'src/contracts/weight_event_repository_contract.dart';
export 'src/contracts/weight_repository_contract.dart';
