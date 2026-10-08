import 'targets_record.dart';

/// Records a set of targets as issued.
abstract interface class TargetsHistoryWriter {
  /// Saves [record]; a record already effective from the same day is replaced.
  Future<void> saveTargets(TargetsRecord record);
}
