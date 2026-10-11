import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

import '../integration_providers.dart';
import 'health_connection_provider.dart';
import 'health_importer_provider.dart';
import 'imported_weigh_ins_provider.dart';

/// Reads what the user has allowed from the health platform (MM-68) and
/// brings what is kept up to date. Returns false when the platform could
/// not be read, in which case nothing kept was changed.
///
/// It is run while the app is on screen: when it opens, when it comes back
/// to the front, and when asked for in Settings. The platform refuses to be
/// read at any other time.
final healthSyncProvider = Provider<Future<bool> Function()>((ref) {
  return () async {
    var changed = false;
    try {
      final permitted = await ref.read(healthSourceProvider).permitted();
      final importer = ref.read(healthImporterProvider);
      for (final type in permitted) {
        final result = await importer.import(type);
        changed =
            changed ||
            result.status == HealthImportStatus.readAgain ||
            result.upserted > 0 ||
            result.deleted > 0;
      }
      return true;
    } on HealthReadFailure {
      return false;
    } on Object {
      // No platform on this kind of device, or its plugin is not there.
      return false;
    } finally {
      // Only when something was read, so the screens that work from the
      // weigh-ins are not made to reload every time the app comes forward.
      if (changed) ref.invalidate(importedWeighInsProvider);
      ref.invalidate(healthConnectionProvider);
    }
  };
});
