import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// An [EntitlementReader] you can set: free by default.
final class InMemoryEntitlement implements EntitlementReader {
  InMemoryEntitlement([
    Entitlement initial = const Entitlement(EntitlementStatus.free),
  ]) : _entitlement = ObservableValue(initial);

  final ObservableValue<Entitlement> _entitlement;

  void set(Entitlement entitlement) => _entitlement.value = entitlement;

  @override
  Stream<Entitlement> watchEntitlement() => _entitlement.watch();
}
