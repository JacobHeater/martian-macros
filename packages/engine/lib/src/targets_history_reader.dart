import 'targets_record.dart';

/// Reads every set of targets ever issued.
abstract interface class TargetsHistoryReader {
  /// Oldest first, then the full list after each change.
  Stream<List<TargetsRecord>> watchTargetsHistory();
}
