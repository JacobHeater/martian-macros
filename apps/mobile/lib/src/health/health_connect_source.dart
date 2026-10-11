import 'package:health/health.dart' as plugin;
import 'package:mm_health_ingest/mm_health_ingest.dart';

import 'health_connect_sample.dart';

/// Android's Health Connect behind [HealthSource] (MM-68), over the
/// `health` plugin. It only reads: nothing is written to the user's health
/// data until writing nutrition is built (MM-70).
///
/// Health Connect refuses to be read while the app is not in the
/// foreground, and the plugin reports a refused read as no readings. So
/// every read is checked by asking for changes straight after it; when
/// that is refused too the answer is thrown away and [HealthReadFailure]
/// thrown, never "nothing".
final class HealthConnectSource implements HealthSource {
  HealthConnectSource([plugin.Health? health])
    : _health = health ?? plugin.Health();

  final plugin.Health _health;
  var _configured = false;

  Future<void> _ready() async {
    if (_configured) return;
    await _health.configure();
    _configured = true;
  }

  static List<HealthSample> _sorted(Iterable<HealthSample> samples) =>
      samples.toList()..sort((a, b) {
        final byStart = a.start.compareTo(b.start);
        return byStart != 0 ? byStart : a.platformId.compareTo(b.platformId);
      });

  /// Whether [type] can be read right now: a fresh token, and its changes
  /// asked for. Both come back null when the platform refuses.
  Future<bool> _readable(plugin.HealthDataType type) async {
    final token = await _health.getChangesToken(types: [type]);
    if (token == null || token.isEmpty) return false;
    return await _health.getChanges(changesToken: token) != null;
  }

  @override
  Future<Set<HealthDataType>> available() async {
    await _ready();
    final status = await _health.getHealthConnectSdkStatus();
    if (status != plugin.HealthConnectSdkStatus.sdkAvailable) return const {};
    return healthConnectTypes.keys.toSet();
  }

  @override
  Future<Set<HealthDataType>> permitted() async {
    final here = await available();
    final granted = <HealthDataType>{};
    for (final type in here) {
      final has = await _health.hasPermissions(
        [healthConnectTypes[type]!],
        permissions: [plugin.HealthDataAccess.READ],
      );
      if (has ?? false) granted.add(type);
    }
    return granted;
  }

  @override
  Future<Set<HealthDataType>> requestPermission(
    Set<HealthDataType> types,
  ) async {
    final here = await available();
    final asked = [
      for (final type in types)
        if (here.contains(type)) healthConnectTypes[type]!,
    ];
    if (asked.isNotEmpty) {
      await _health.requestAuthorization(
        asked,
        permissions: [for (final _ in asked) plugin.HealthDataAccess.READ],
      );
    }
    return permitted();
  }

  @override
  Future<List<HealthSample>> read(
    HealthDataType type, {
    required DateTime from,
    required DateTime to,
  }) async {
    if (!to.isAfter(from) || !(await permitted()).contains(type)) {
      return const [];
    }
    final theirs = healthConnectTypes[type]!;
    final points = await _health.getHealthDataFromTypes(
      types: [theirs],
      startTime: from,
      endTime: to,
    );
    // A refused read looks like no readings; see the class comment.
    if (!await _readable(theirs)) {
      throw HealthReadFailure('reading ${type.name}');
    }
    return _sorted([
      for (final point in points)
        if (healthConnectSample(point) case final sample?
            when sample.type == type &&
                !sample.start.isBefore(from) &&
                sample.start.isBefore(to))
          sample,
    ]);
  }

  @override
  Future<HealthChanges> changesSince(HealthDataType type, String? token) async {
    if (!(await permitted()).contains(type)) {
      return HealthChanges(nextToken: token ?? 'not-permitted');
    }
    final theirs = healthConnectTypes[type]!;
    if (token == null) {
      // The token first, so nothing written while reading is missed: it
      // comes again with the next changes, which changes nothing.
      final next = await _health.getChangesToken(types: [theirs]);
      if (next == null || next.isEmpty) {
        throw HealthReadFailure('a token for ${type.name}');
      }
      final everything = await read(
        type,
        from: DateTime(1900),
        to: DateTime(2200),
      );
      return HealthChanges(nextToken: next, upserted: everything);
    }
    final upserted = <String, HealthSample>{};
    final deleted = <String>{};
    var at = token;
    while (true) {
      final page = await _health.getChanges(changesToken: at);
      if (page == null) {
        // Refused. If the platform can be read at all just now, it is the
        // token that is no good, and everything is to be read again.
        if (await _readable(theirs)) return const HealthChanges.expired();
        throw HealthReadFailure('changes in ${type.name}');
      }
      if (page.changesTokenExpired) return const HealthChanges.expired();
      for (final change in page.changes) {
        final point = change.dataPoint;
        if (change.type == plugin.HealthChangeType.delete) {
          final id = change.recordId;
          if (id != null) {
            deleted.add(id);
            upserted.remove(id);
          }
        } else if (point != null) {
          final sample = healthConnectSample(point);
          if (sample != null && sample.type == type) {
            upserted[sample.platformId] = sample;
            deleted.remove(sample.platformId);
          }
        }
      }
      if (page.nextChangesToken.isNotEmpty) at = page.nextChangesToken;
      if (!page.hasMore) break;
    }
    return HealthChanges(
      nextToken: at,
      upserted: _sorted(upserted.values),
      deletedIds: deleted.toList()..sort(),
    );
  }

  @override
  Future<bool> writeNutrition(NutritionRecord record) async => false;
}
