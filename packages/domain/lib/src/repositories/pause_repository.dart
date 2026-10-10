import 'pause_reader.dart';
import 'pause_writer.dart';

/// Reads and writes pauses (MM-148).
abstract interface class PauseRepository implements PauseReader, PauseWriter {}
