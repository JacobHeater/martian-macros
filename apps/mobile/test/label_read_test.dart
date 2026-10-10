import 'package:flutter/material.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food/label/label_text_reader_provider.dart';
import 'package:martian_macros/src/food/scan/barcode_scanner_provider.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/fake_barcode_scanner.dart';
import 'support/fake_label_text_reader.dart';
import 'support/pump_app.dart';

/// MM-44: read a Nutrition Facts panel into a saved food. The camera and the
/// text recogniser are fakes; the real plugins need a device.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  const panel = '''
Nutrition Facts
Serving size 1 bar (40g)
Calories 180
Total Fat 6g
Total Carbohydrate 24g
Protein 8g
''';
  // 8*4 + 24*4 + 6*9 = 182, so 180 agrees.
  const misread = '''
Serving size 1 bar (40g)
Calories 800
Total Fat 6g
Total Carbohydrate 24g
Protein 8g
''';

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> openForm(WidgetTester tester, String? text) async {
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: <Override>[
        labelTextReaderProvider.overrideWithValue(FakeLabelTextReader(text)),
      ],
    );
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('food-my-foods')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('new-custom-food')));
    await tester.pumpAndSettle();
  }

  String field(WidgetTester tester, String key) => tester
      .widget<EditableText>(
        find.descendant(
          of: find.byKey(ValueKey(key)),
          matching: find.byType(EditableText),
        ),
      )
      .controller
      .text;

  testWidgets('a clear label fills the form to be checked', (tester) async {
    await openForm(tester, panel);
    await tester.tap(find.byKey(const ValueKey('custom-read-label')));
    await tester.pumpAndSettle();
    expect(field(tester, 'custom-kcal'), '180');
    expect(field(tester, 'custom-protein'), '8');
    expect(field(tester, 'custom-carbs'), '24');
    expect(field(tester, 'custom-fat'), '6');
    expect(field(tester, 'custom-grams'), '40');
    expect(field(tester, 'custom-serving'), '1 bar (40g)');
    expect(find.textContaining('Check every number'), findsOneWidget);
    expect(find.textContaining('Double-check the label'), findsNothing);
  });

  testWidgets('a misread calorie figure is flagged', (tester) async {
    await openForm(tester, misread);
    await tester.tap(find.byKey(const ValueKey('custom-read-label')));
    await tester.pumpAndSettle();
    expect(field(tester, 'custom-kcal'), '800');
    expect(find.textContaining('Double-check the label'), findsOneWidget);
  });

  testWidgets('nothing readable says so and leaves the form alone', (
    tester,
  ) async {
    await openForm(tester, 'a photo of a cat');
    await tester.tap(find.byKey(const ValueKey('custom-read-label')));
    await tester.pumpAndSettle();
    expect(find.textContaining('No Nutrition Facts panel'), findsOneWidget);
    expect(field(tester, 'custom-kcal'), '');
  });

  testWidgets('cancelling the camera changes nothing', (tester) async {
    await openForm(tester, null);
    await tester.tap(find.byKey(const ValueKey('custom-read-label')));
    await tester.pumpAndSettle();
    expect(field(tester, 'custom-kcal'), '');
    expect(find.textContaining('Check every number'), findsNothing);
  });

  testWidgets('an unknown barcode, once read and saved, is found again', (
    tester,
  ) async {
    const digits = '4006381333931';
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: <Override>[
        labelTextReaderProvider.overrideWithValue(
          const FakeLabelTextReader(panel),
        ),
        barcodeScannerProvider.overrideWithValue(
          const FakeBarcodeScanner(digits),
        ),
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
    await tester.tap(find.text('Scan $digits'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('barcode-read-label')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('custom-read-label')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('custom-name')), 'Bar');
    await tester.pump();
    final save = find.byKey(const ValueKey('custom-save'));
    await tester.ensureVisible(save);
    await tester.tap(save);
    await tester.pumpAndSettle();
    final saved = await readNow(
      tester,
      () => repos.customFoods.watchCustomFoods().first,
    );
    expect(saved.single.name, 'Bar');
    expect(saved.single.barcode, normalizeBarcode(digits));
    expect(saved.single.perServing.kcal, 180);
  });
}
