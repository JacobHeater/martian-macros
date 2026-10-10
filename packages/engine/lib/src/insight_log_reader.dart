import 'insight_log_entry.dart';

/// Reads which insights have been shown and dismissed.
abstract interface class InsightLogReader {
  /// Oldest first, then the full list after each change.
  Stream<List<InsightLogEntry>> watchInsightLog();
}
