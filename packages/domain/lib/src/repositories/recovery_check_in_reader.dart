import '../recovery_check_in.dart';

/// Reads the weekly recovery check-ins (MM-116).
abstract interface class RecoveryCheckInReader {
  /// Every check-in, oldest first, then the full list after each change.
  Stream<List<RecoveryCheckIn>> watchRecoveryCheckIns();
}
