import 'health_data_type.dart';
import 'health_import_result.dart';
import 'health_import_status.dart';
import 'health_sample_store.dart';
import 'health_source.dart';

/// Brings what is stored up to date with the platform (MM-67).
///
/// It asks only for what changed since last time. A reading edited on the
/// platform replaces the stored one; one deleted there is removed here;
/// importing twice changes nothing. When the platform has forgotten the
/// token, everything is read again and the store made to match.
final class HealthImporter {
  const HealthImporter({required this.source, required this.store});

  final HealthSource source;
  final HealthSampleStore store;

  Future<HealthImportResult> import(HealthDataType type) async {
    if (!(await source.permitted()).contains(type)) {
      return const HealthImportResult(HealthImportStatus.notPermitted);
    }
    final changes = await source.changesSince(type, await store.token(type));
    if (changes.tokenExpired) {
      final all = await source.changesSince(type, null);
      await store.replace(type, all.upserted);
      await store.saveToken(type, all.nextToken);
      return HealthImportResult(
        HealthImportStatus.readAgain,
        upserted: all.upserted.length,
      );
    }
    await store.upsert(changes.upserted);
    await store.delete(type, changes.deletedIds);
    // Last, so an import cut short is asked for again and applied again,
    // which changes nothing the second time.
    await store.saveToken(type, changes.nextToken);
    return HealthImportResult(
      HealthImportStatus.updated,
      upserted: changes.upserted.length,
      deleted: changes.deletedIds.length,
    );
  }
}
