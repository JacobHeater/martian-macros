import 'dart:convert';

import '../health_changes.dart';
import '../health_data_type.dart';
import '../health_sample.dart';
import '../health_source.dart';
import '../nutrition_record.dart';

/// A [HealthSource] that replays a recorded history (MM-67), so everything
/// above the seam runs with no phone.
///
/// The history is a list of events in the order they happened: a reading
/// added, edited or deleted. A test shows the source the first few
/// ([happened]) and lets more happen later, as a platform changes between
/// two imports. Tokens are honored until [expireTokens].
final class FakeHealthSource implements HealthSource {
  FakeHealthSource._(this._sources, this._events, this.happened);

  /// Reads a history: `{"sources": [{"id", "name"}], "events": [{"op":
  /// "add" | "edit" | "delete", "type", "id", "value", "start", "end"?,
  /// "source"}]}`, as in `recordedHealthHistory` or a file of the same
  /// shape. Times are local, in ISO 8601. With [happened], only that many
  /// events have taken place yet.
  factory FakeHealthSource.fromJson(String json, {int? happened}) {
    final decoded = jsonDecode(json) as Map<String, Object?>;
    final sources = {
      for (final source in decoded['sources']! as List<Object?>)
        (source! as Map<String, Object?>)['id']! as String:
            (source as Map<String, Object?>)['name']! as String,
    };
    final events = [
      for (final event in decoded['events']! as List<Object?>)
        event! as Map<String, Object?>,
    ];
    return FakeHealthSource._(sources, events, happened ?? events.length);
  }

  final Map<String, String> _sources;
  final List<Map<String, Object?>> _events;

  /// How many of the recorded events have taken place.
  int happened;

  /// What the user would allow if asked; everything by default.
  Set<HealthDataType>? willPermit;

  /// Whether the platform takes nutrition from the app.
  bool takesNutrition = true;

  /// What was written with [writeNutrition], by record id.
  final written = <String, NutritionRecord>{};

  final _permitted = <HealthDataType>{};
  var _generation = 0;

  /// Lets every recorded event take place.
  void letAllHappen() => happened = _events.length;

  /// Makes every token issued so far one the platform no longer honors.
  void expireTokens() => _generation++;

  /// Permits [types], or everything available, without asking.
  Future<void> permit([Set<HealthDataType>? types]) async =>
      _permitted.addAll(types ?? await available());

  static HealthDataType _type(Map<String, Object?> event) =>
      HealthDataType.values.byName(event['type']! as String);

  HealthSample _sample(Map<String, Object?> event) {
    final source = event['source']! as String;
    final end = event['end'] as String?;
    return HealthSample(
      platformId: event['id']! as String,
      type: _type(event),
      value: (event['value']! as num).toDouble(),
      start: DateTime.parse(event['start']! as String),
      end: end == null ? null : DateTime.parse(end),
      sourceId: source,
      sourceName: _sources[source] ?? source,
    );
  }

  /// The readings of [type] as they stand after the first [count] events.
  Map<String, HealthSample> _state(HealthDataType type, int count) {
    final state = <String, HealthSample>{};
    for (final event in _events.take(count)) {
      if (_type(event) != type) continue;
      final id = event['id']! as String;
      if (event['op'] == 'delete') {
        state.remove(id);
      } else {
        state[id] = _sample(event);
      }
    }
    return state;
  }

  static List<HealthSample> _sorted(Iterable<HealthSample> samples) =>
      samples.toList()..sort((a, b) {
        final byStart = a.start.compareTo(b.start);
        return byStart != 0 ? byStart : a.platformId.compareTo(b.platformId);
      });

  @override
  Future<Set<HealthDataType>> available() async => {
    for (final event in _events) _type(event),
  };

  @override
  Future<Set<HealthDataType>> permitted() async => {..._permitted};

  @override
  Future<Set<HealthDataType>> requestPermission(
    Set<HealthDataType> types,
  ) async {
    final here = await available();
    _permitted.addAll(
      types.where((t) => here.contains(t) && (willPermit?.contains(t) ?? true)),
    );
    return permitted();
  }

  @override
  Future<List<HealthSample>> read(
    HealthDataType type, {
    required DateTime from,
    required DateTime to,
  }) async {
    if (!_permitted.contains(type)) return const [];
    return _sorted(
      _state(
        type,
        happened,
      ).values.where((s) => !s.start.isBefore(from) && s.start.isBefore(to)),
    );
  }

  @override
  Future<HealthChanges> changesSince(HealthDataType type, String? token) async {
    final next = '$_generation:$happened';
    if (!_permitted.contains(type)) return HealthChanges(nextToken: next);
    if (token == null) {
      return HealthChanges(
        nextToken: next,
        upserted: _sorted(_state(type, happened).values),
      );
    }
    final parts = token.split(':');
    final seen = parts.length == 2 ? int.tryParse(parts[1]) : null;
    if (seen == null || parts[0] != '$_generation' || seen > happened) {
      return const HealthChanges.expired();
    }
    final now = _state(type, happened);
    final touched = {
      for (final event in _events.take(happened).skip(seen))
        if (_type(event) == type) event['id']! as String,
    };
    return HealthChanges(
      nextToken: next,
      upserted: _sorted([for (final id in touched) ?now[id]]),
      deletedIds: [
        for (final id in touched)
          if (!now.containsKey(id)) id,
      ]..sort(),
    );
  }

  @override
  Future<bool> writeNutrition(NutritionRecord record) async {
    if (!takesNutrition) return false;
    written[record.id] = record;
    return true;
  }
}
