import 'dart:typed_data';

import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_fixtures/mm_fixtures_contracts.dart';
import 'package:test/test.dart';

/// The integration-seam fixtures: they satisfy the same contracts a real
/// provider will, and can be scripted to fail so offline and denied paths are
/// tested without a device.
void main() {
  foodSearchContract('In-memory', InMemoryFoodCatalog.new);
  foodBarcodeLookupContract('In-memory', InMemoryFoodCatalog.new);
  backupStorageContract('In-memory', InMemoryBackupStorage.new);
  entitlementReaderContract('In-memory', InMemoryEntitlement.new);
  clockContract('System', SystemClock.new);
  clockContract('Fixed', () => FixedClock(CalendarDate(2026, 10, 8)));

  group('scripted failures', () {
    test(
      'a catalog that is offline answers Unavailable to every call',
      () async {
        final catalog = InMemoryFoodCatalog(const []);
        catalog.failWith(const Unavailable('offline'));
        expect(
          await catalog.search('oats'),
          isA<Unavailable<List<FoodItem>>>(),
        );
        expect(await catalog.lookup('1'), isA<Unavailable<FoodItem>>());
        catalog.recover();
        expect(await catalog.search('oats'), isA<Succeeded<List<FoodItem>>>());
      },
    );

    test('a denied backup answers Denied with the message', () async {
      final storage = InMemoryBackupStorage()
        ..failWith(const Denied('signed out'));
      final result = await storage.put('a', Uint8List(1));
      expect((result as Denied<void>).message, 'signed out');
    });

    test('failWith rejects a non-failure', () async {
      final storage = InMemoryBackupStorage();
      storage.failWith(const NotFound());
      await expectLater(storage.list(), throwsStateError);
    });
  });

  group('FixedClock', () {
    test('can be moved to another day', () {
      final clock = FixedClock(CalendarDate(2026, 10, 8));
      clock.advanceTo(CalendarDate(2026, 10, 9));
      expect(clock.today().epochDay, CalendarDate(2026, 10, 9).epochDay);
    });
  });

  group('InMemoryEntitlement', () {
    test('starts free and follows changes', () async {
      final entitlement = InMemoryEntitlement();
      expect(
        (await entitlement.watchEntitlement().first).status,
        EntitlementStatus.free,
      );
      entitlement.set(const Entitlement(EntitlementStatus.unlocked));
      expect(
        (await entitlement.watchEntitlement().first).coachAvailable,
        isTrue,
      );
    });
  });
}
