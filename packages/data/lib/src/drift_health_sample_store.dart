import 'package:drift/drift.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

import 'app_database.dart';

/// [HealthSampleStore] over the Drift database.
final class DriftHealthSampleStore implements HealthSampleStore {
  DriftHealthSampleStore(this._db);

  final AppDatabase _db;

  @override
  Future<List<HealthSample>> samples(HealthDataType type) async {
    final rows =
        await (_db.select(_db.importedSamples)
              ..where((t) => t.type.equalsValue(type))
              ..orderBy([
                (t) => OrderingTerm.asc(t.startMs),
                (t) => OrderingTerm.asc(t.platformId),
              ]))
            .get();
    return [
      for (final row in rows)
        HealthSample(
          platformId: row.platformId,
          type: row.type,
          value: row.value,
          start: DateTime.fromMillisecondsSinceEpoch(row.startMs),
          end: row.endMs == null
              ? null
              : DateTime.fromMillisecondsSinceEpoch(row.endMs!),
          sourceId: row.sourceId,
          sourceName: row.sourceName,
        ),
    ];
  }

  @override
  Future<void> upsert(List<HealthSample> samples) => _db.batch((batch) {
    batch.insertAllOnConflictUpdate(_db.importedSamples, [
      for (final sample in samples)
        ImportedSamplesCompanion.insert(
          type: sample.type,
          platformId: sample.platformId,
          value: sample.value,
          startMs: sample.start.millisecondsSinceEpoch,
          endMs: Value(sample.end?.millisecondsSinceEpoch),
          sourceId: sample.sourceId,
          sourceName: sample.sourceName,
        ),
    ]);
  });

  @override
  Future<void> delete(HealthDataType type, List<String> platformIds) =>
      (_db.delete(_db.importedSamples)..where(
            (t) => t.type.equalsValue(type) & t.platformId.isIn(platformIds),
          ))
          .go();

  @override
  Future<void> replace(HealthDataType type, List<HealthSample> samples) =>
      _db.transaction(() async {
        await (_db.delete(
          _db.importedSamples,
        )..where((t) => t.type.equalsValue(type))).go();
        await upsert(samples);
      });

  @override
  Future<String?> token(HealthDataType type) async => (await (_db.select(
    _db.healthImportTokens,
  )..where((t) => t.type.equalsValue(type))).getSingleOrNull())?.token;

  @override
  Future<void> saveToken(HealthDataType type, String token) => _db
      .into(_db.healthImportTokens)
      .insertOnConflictUpdate(
        HealthImportTokensCompanion.insert(type: type, token: token),
      );
}
