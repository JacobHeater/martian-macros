import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// What every [EntitlementReader] must do.
void entitlementReaderContract(
  String name,
  EntitlementReader Function() create,
) {
  group('$name as an EntitlementReader', () {
    test('emits the current entitlement first', () async {
      final first = await create().watchEntitlement().first;
      expect(EntitlementStatus.values, contains(first.status));
    });

    test('coach is available exactly when not on the free tier', () {
      expect(const Entitlement(EntitlementStatus.free).coachAvailable, isFalse);
      expect(const Entitlement(EntitlementStatus.trial).coachAvailable, isTrue);
      expect(
        const Entitlement(EntitlementStatus.unlocked).coachAvailable,
        isTrue,
      );
    });
  });
}
