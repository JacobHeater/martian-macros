import 'recovery_check_in_reader.dart';
import 'recovery_check_in_writer.dart';

/// Reads and writes the weekly recovery check-ins (MM-116).
abstract interface class RecoveryCheckInRepository
    implements RecoveryCheckInReader, RecoveryCheckInWriter {}
