import '../pause.dart';

/// Reads the pauses the user has set (MM-148).
abstract interface class PauseReader {
  /// Every pause, oldest first, then the full list after each change.
  Stream<List<Pause>> watchPauses();
}
