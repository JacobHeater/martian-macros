import '../pause.dart';

/// Writes the pauses the user has set (MM-148).
abstract interface class PauseWriter {
  /// Adds [pause], or replaces the one that starts on the same day.
  Future<void> savePause(Pause pause);

  /// Removes the pause that starts on the same day as [pause], if stored.
  Future<void> deletePause(Pause pause);
}
