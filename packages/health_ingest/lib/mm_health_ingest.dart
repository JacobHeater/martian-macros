/// The seam to a phone's health platform (MM-67): Health Connect, HealthKit,
/// or a fake. Everything above it depends on [HealthSource] and never on a
/// platform, so it can be built and tested on any machine.
library;

export 'src/health_changes.dart';
export 'src/health_data_type.dart';
export 'src/health_import_result.dart';
export 'src/health_import_status.dart';
export 'src/health_importer.dart';
export 'src/health_sample.dart';
export 'src/health_sample_store.dart';
export 'src/health_source.dart';
export 'src/nutrition_record.dart';
