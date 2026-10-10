import 'insight_log_reader.dart';
import 'insight_log_writer.dart';

/// Reads and writes the log of shown insights.
abstract interface class InsightLogRepository
    implements InsightLogReader, InsightLogWriter {}
