import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

import '../integration_providers.dart';
import '../repository_providers.dart';

/// Brings the stored readings up to date with the health platform (MM-67).
final healthImporterProvider = Provider<HealthImporter>(
  (ref) => HealthImporter(
    source: ref.watch(healthSourceProvider),
    store: ref.watch(healthSampleStoreProvider),
  ),
);
