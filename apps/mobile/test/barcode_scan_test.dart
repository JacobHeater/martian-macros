import 'package:flutter/material.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food/scan/barcode_scanner_provider.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/fake_barcode_scanner.dart';
import 'support/pump_app.dart';

/// MM-43: scan a barcode, or type it, and log the product found. The camera is
/// a fake; the real plugin needs a device (see the ticket's verification).
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  final known = FixturePack.entries.firstWhere((e) => e.barcodes.isNotEmpty);
  final gtin14 = known.barcodes.first;
  final ean13 = gtin14.substring(1);

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> openScan(WidgetTester tester, FakeBarcodeScanner scanner) async {
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: <Override>[
        barcodeScannerProvider.overrideWithValue(scanner),
        foodCatalogProvider.overrideWith(
          (ref) async => FoodCatalog([
            SqliteFoodPack.fromDatabase(
              const FoodPackWriter().writeInMemory(
                FixturePack.header,
                FixturePack.entries,
              ),
            ),
          ]),
        ),
      ],
    );
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('food-scan')));
    await tester.pumpAndSettle();
  }

  testWidgets('a scanned product opens its amount step', (tester) async {
    await openScan(tester, FakeBarcodeScanner(ean13));
    await tester.tap(find.text('Scan $ean13'));
    await tester.pumpAndSettle();
    expect(find.text(known.food.name), findsOneWidget);
    expect(find.byKey(const ValueKey('amount-log')), findsOneWidget);
  });

  testWidgets('an unknown barcode offers manual entry', (tester) async {
    await openScan(tester, FakeBarcodeScanner('4006381333931'));
    await tester.tap(find.text('Scan 4006381333931'));
    await tester.pumpAndSettle();
    expect(find.textContaining('not in the food database'), findsOneWidget);
    await tester.tap(find.text('Enter manually'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('food-kcal')), findsOneWidget);
  });

  testWidgets('with the camera denied, typing the digits still works', (
    tester,
  ) async {
    await openScan(
      tester,
      const FakeBarcodeScanner('0', cameraAvailable: false),
    );
    expect(find.textContaining('camera is not available'), findsOneWidget);
    await tester.enterText(find.byKey(const ValueKey('barcode-digits')), ean13);
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('barcode-lookup')));
    await tester.pumpAndSettle();
    expect(find.text(known.food.name), findsOneWidget);
  });

  testWidgets('digits that are not a barcode are said so', (tester) async {
    await openScan(
      tester,
      const FakeBarcodeScanner('0', cameraAvailable: false),
    );
    await tester.enterText(find.byKey(const ValueKey('barcode-digits')), '123');
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('barcode-lookup')));
    await tester.pumpAndSettle();
    expect(find.textContaining('not a valid barcode'), findsOneWidget);
  });
}
