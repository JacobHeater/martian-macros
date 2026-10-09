import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food/food_trust_mark.dart';
import 'package:martian_macros/src/format/rounded_to_zero_note.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

/// MM-153: where a food's numbers came from, in words, and no false "verified".
CatalogFood food(String source, TrustTier tier, {double kcal = 100}) =>
    CatalogFood(
      id: 1,
      packId: 'p',
      name: 'Oats',
      kcal: kcal,
      proteinG: 10,
      carbsG: 10,
      fatG: 5,
      source: source,
      tier: tier,
      tierReason: 'Energy and macros barely agree: compare with the package.',
    );

Future<void> show(WidgetTester tester, CatalogFood f) => tester.pumpWidget(
  MaterialApp(
    theme: mmTheme(Brightness.light),
    home: Scaffold(body: FoodTrustMark(food: f)),
  ),
);

void main() {
  testWidgets('a reference food names its source and tier only', (t) async {
    await show(t, food('usda_foundation', TrustTier.reference));
    expect(find.textContaining('USDA, lab-analyzed'), findsOneWidget);
    expect(find.textContaining('Reference'), findsOneWidget);
    expect(find.textContaining('compare with the package'), findsNothing);
  });

  testWidgets('a doubtful food is marked Check this with the reason', (
    t,
  ) async {
    await show(t, food('off', TrustTier.checkThis));
    expect(
      find.textContaining('Community label (Open Food Facts)'),
      findsOneWidget,
    );
    expect(find.textContaining('Check this'), findsOneWidget);
    expect(find.textContaining('compare with the package'), findsOneWidget);
  });

  testWidgets('no tier or source is described as verified', (t) async {
    for (final tier in TrustTier.values) {
      for (final source in [
        'usda_foundation',
        'usda_sr_legacy',
        'usda_branded',
        'off',
        'other',
      ]) {
        await show(t, food(source, tier));
        expect(
          find.textContaining(RegExp('verif', caseSensitive: false)),
          findsNothing,
        );
      }
    }
  });

  group('rounded to zero', () {
    const spray = CatalogServing(description: '1 spray', grams: 0.25);
    test('a 0 kcal spray serving gets the note', () {
      expect(
        roundedToZeroNote(food('off', TrustTier.label, kcal: 0), spray),
        contains('round small servings to zero'),
      );
    });
    test('a normal serving does not', () {
      const cup = CatalogServing(description: '1 cup', grams: 240);
      expect(roundedToZeroNote(food('off', TrustTier.label), cup), isNull);
    });
    test('a tiny but energy-dense serving does not', () {
      const pinch = CatalogServing(description: 'tsp', grams: 4);
      expect(
        roundedToZeroNote(food('off', TrustTier.label, kcal: 900), pinch),
        isNull,
      );
    });
  });
}
