import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [RecoveryCheckInRepository] held in memory.
final class InMemoryRecoveryCheckInRepository
    implements RecoveryCheckInRepository {
  final _checkIns = ObservableValue<List<RecoveryCheckIn>>(const []);

  @override
  Stream<List<RecoveryCheckIn>> watchRecoveryCheckIns() => _checkIns.watch();

  @override
  Future<void> saveRecoveryCheckIn(RecoveryCheckIn checkIn) async {
    _checkIns.value = [
      for (final existing in _checkIns.value)
        if (existing.date != checkIn.date) existing,
      checkIn,
    ]..sort((a, b) => a.date.compareTo(b.date));
  }

  /// Empties the store (used by [InMemoryDataEraser]).
  void clear() => _checkIns.value = const [];
}
