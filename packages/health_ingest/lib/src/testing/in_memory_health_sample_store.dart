import '../health_data_type.dart';
import '../health_sample.dart';
import '../health_sample_store.dart';

/// [HealthSampleStore] held in memory.
final class InMemoryHealthSampleStore implements HealthSampleStore {
  final _samples = <(HealthDataType, String), HealthSample>{};
  final _tokens = <HealthDataType, String>{};

  @override
  Future<List<HealthSample>> samples(HealthDataType type) async =>
      [
        for (final sample in _samples.values)
          if (sample.type == type) sample,
      ]..sort((a, b) {
        final byStart = a.start.compareTo(b.start);
        return byStart != 0 ? byStart : a.platformId.compareTo(b.platformId);
      });

  @override
  Future<void> upsert(List<HealthSample> samples) async {
    for (final sample in samples) {
      _samples[(sample.type, sample.platformId)] = sample;
    }
  }

  @override
  Future<void> delete(HealthDataType type, List<String> platformIds) async {
    for (final id in platformIds) {
      _samples.remove((type, id));
    }
  }

  @override
  Future<void> replace(HealthDataType type, List<HealthSample> samples) async {
    _samples.removeWhere((key, _) => key.$1 == type);
    await upsert(samples);
  }

  @override
  Future<String?> token(HealthDataType type) async => _tokens[type];

  @override
  Future<void> saveToken(HealthDataType type, String token) async =>
      _tokens[type] = token;

  /// Forgets everything, as erasing the app's data does.
  void clear() {
    _samples.clear();
    _tokens.clear();
  }
}
