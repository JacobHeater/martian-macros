import 'targets_history_reader.dart';
import 'targets_history_writer.dart';

/// Reads and writes the history of issued targets.
abstract interface class TargetsHistoryRepository
    implements TargetsHistoryReader, TargetsHistoryWriter {}
