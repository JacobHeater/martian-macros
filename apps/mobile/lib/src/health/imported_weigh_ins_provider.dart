import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

import '../integration_providers.dart';
import '../repository_providers.dart';

/// The imported weigh-in that counts for each day (MM-71), from what has
/// been read and kept. Invalidated after every import. Empty when nothing
/// has been imported.
final importedWeighInsProvider = FutureProvider<List<DayWeighIn>>((ref) async {
  final samples = await ref
      .watch(healthSampleStoreProvider)
      .samples(HealthDataType.weight);
  return dailyWeighIns(
    samples,
    primarySourceId: primaryWeightSource(
      samples,
      asOf: ref.watch(clockProvider).now(),
    ),
  );
});
