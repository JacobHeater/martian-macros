import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

import '../integration_providers.dart';
import '../repository_providers.dart';
import 'health_connection.dart';

/// The health platform as it stands (MM-68), read afresh whenever it is
/// invalidated, so a permission taken away in the phone's settings is
/// noticed. Null where no platform is registered or it cannot be asked.
final healthConnectionProvider = FutureProvider<HealthConnection?>((ref) async {
  try {
    final source = ref.watch(healthSourceProvider);
    final store = ref.watch(healthSampleStoreProvider);
    final available = await source.available();
    final permitted = available.isEmpty
        ? const <HealthDataType>{}
        : await source.permitted();
    return HealthConnection(
      available: available,
      permitted: permitted,
      imported: {for (final type in permitted) type: await store.samples(type)},
    );
  } on Object {
    // No platform on this kind of device, or its plugin is not there.
    return null;
  }
});
