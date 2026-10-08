import 'entitlement.dart';

/// Whether Coach is available. Implemented by the store billing libraries, a
/// local trial clock, or a fixture; free logging never depends on it.
abstract interface class EntitlementReader {
  /// The current entitlement, then every change.
  Stream<Entitlement> watchEntitlement();
}
