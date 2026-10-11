/// Stand-ins for a health platform and its store, and the test suite every
/// [HealthSource] has to pass (MM-67). For tests and demos; never the
/// user's real data.
library;

export 'src/testing/fake_health_source.dart';
export 'src/testing/health_sample_store_contract.dart';
export 'src/testing/health_source_contract.dart';
export 'src/testing/in_memory_health_sample_store.dart';
export 'src/testing/recorded_health_history.dart';
