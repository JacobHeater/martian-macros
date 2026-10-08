import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [SetupRepository] held in memory.
final class InMemorySetupRepository implements SetupRepository {
  final _setup = ObservableValue<UserSetup?>(null);

  @override
  Stream<UserSetup?> watchSetup() => _setup.watch();

  @override
  Future<UserSetup?> loadSetup() async => _setup.value;

  @override
  Future<void> saveSetup(UserSetup setup) async => _setup.value = setup;

  /// Empties the store (used by [InMemoryDataEraser]).
  void clear() => _setup.value = null;
}
