import '../recovery_check_in.dart';

/// Writes the weekly recovery check-ins (MM-116).
abstract interface class RecoveryCheckInWriter {
  /// Adds [checkIn], or replaces the one answered on the same day.
  Future<void> saveRecoveryCheckIn(RecoveryCheckIn checkIn);
}
