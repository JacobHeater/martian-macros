import '../food/easy_to_miss/easy_to_miss_preference.dart';

/// Reads the setting for the easy-to-miss line.
abstract interface class EasyToMissReader {
  /// The setting, then each change. On and never shown until it changes.
  Stream<EasyToMissPreference> watchEasyToMiss();
}
