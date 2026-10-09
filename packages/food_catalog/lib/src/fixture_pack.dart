import 'catalog_food.dart';
import 'catalog_serving.dart';
import 'food_pack_format.dart';
import 'food_pack_header.dart';
import 'pack_entry.dart';
import 'preparation_state.dart';
import 'trust_tier.dart';

/// A small invented pack for tests and for building screens before the real
/// pack exists (MM-55). **The values are rounded, from general knowledge, and
/// are not a nutrition source**: nothing here may be shown to a user as a
/// food's real nutrition.
abstract final class FixturePack {
  static const packId = 'fixture';

  static const header = FoodPackHeader(
    packId: packId,
    formatVersion: FoodPackFormat.version,
    builtOn: '2026-10-09',
    region: 'US',
    sources: ['Invented test data'],
    license: 'Test data: no license applies and it must not be published.',
    attribution: 'None: invented for tests.',
  );

  static const _reason = 'Test data, not a nutrition source.';

  static PackEntry _entry(
    int id,
    String name,
    double kcal,
    double protein,
    double carbs,
    double fat, {
    double? fiber,
    double? alcohol,
    double? density,
    String? brand,
    PreparationState preparation = PreparationState.unspecified,
    int? pair,
    List<CatalogServing> servings = const [],
    String? barcodeBody,
  }) => PackEntry(
    food: CatalogFood(
      id: id,
      packId: packId,
      name: name,
      brand: brand,
      kcal: kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      fiberG: fiber,
      alcoholG: alcohol,
      densityGPerMl: density,
      preparation: preparation,
      pairedFoodId: pair,
      source: 'fixture',
      sourceId: 'fixture-$id',
      tier: brand == null ? TrustTier.reference : TrustTier.label,
      tierReason: _reason,
    ),
    servings: servings,
    barcodes: [if (barcodeBody != null) gtin14(barcodeBody)],
  );

  static const _raw = PreparationState.raw;
  static const _cooked = PreparationState.cooked;

  /// The GTIN-14 for a 13-digit body, with its check digit appended.
  static String gtin14(String body13) {
    var sum = 0;
    for (var i = 0; i < body13.length; i++) {
      final digit = body13.codeUnitAt(i) - 0x30;
      final fromRight = body13.length - i;
      sum += digit * (fromRight.isOdd ? 3 : 1);
    }
    return '$body13${(10 - sum % 10) % 10}';
  }

  static final List<PackEntry> entries = [
    _entry(
      1,
      'Chicken breast, raw',
      120,
      22.5,
      0,
      2.6,
      preparation: _raw,
      pair: 2,
    ),
    _entry(
      2,
      'Chicken breast, cooked',
      165,
      31,
      0,
      3.6,
      preparation: _cooked,
      pair: 1,
      servings: const [CatalogServing(description: '1 breast', grams: 172)],
    ),
    _entry(3, 'White rice, raw', 365, 7, 80, 0.7, preparation: _raw, pair: 4),
    _entry(
      4,
      'White rice, cooked',
      130,
      2.7,
      28,
      0.3,
      preparation: _cooked,
      pair: 3,
      servings: const [CatalogServing(description: '1 cup', grams: 158)],
    ),
    _entry(
      5,
      'Egg, whole',
      143,
      12.6,
      0.7,
      9.5,
      servings: const [CatalogServing(description: '1 large egg', grams: 50)],
    ),
    _entry(
      6,
      'Banana',
      89,
      1.1,
      23,
      0.3,
      fiber: 2.6,
      servings: const [CatalogServing(description: '1 medium', grams: 118)],
    ),
    _entry(
      7,
      'Apple',
      52,
      0.3,
      14,
      0.2,
      fiber: 2.4,
      servings: const [CatalogServing(description: '1 medium', grams: 182)],
    ),
    _entry(
      8,
      'Oats, dry',
      389,
      16.9,
      66,
      6.9,
      fiber: 10.6,
      servings: const [CatalogServing(description: '1/2 cup', grams: 40)],
    ),
    _entry(
      9,
      'Milk, whole',
      61,
      3.2,
      4.8,
      3.3,
      density: 1.03,
      servings: const [CatalogServing(description: '1 cup', grams: 244)],
    ),
    _entry(
      10,
      'Olive oil',
      884,
      0,
      0,
      100,
      density: 0.91,
      servings: const [CatalogServing(description: '1 tbsp', grams: 13.5)],
    ),
    _entry(11, 'Almonds', 579, 21, 22, 50, fiber: 12.5),
    _entry(12, 'Broccoli, raw', 34, 2.8, 7, 0.4, fiber: 2.6, preparation: _raw),
    _entry(13, 'Salmon, cooked', 206, 22, 0, 12, preparation: _cooked),
    _entry(14, 'Bread, white', 265, 9, 49, 3.2, fiber: 2.7),
    _entry(15, 'Greek yogurt, plain nonfat', 59, 10.2, 3.6, 0.4),
    _entry(
      16,
      'Lentils, cooked',
      116,
      9,
      20,
      0.4,
      fiber: 7.9,
      preparation: _cooked,
    ),
    _entry(
      17,
      'Sweet potato, baked',
      90,
      2,
      21,
      0.2,
      fiber: 3.3,
      preparation: _cooked,
    ),
    _entry(18, 'Peanut butter', 588, 25, 20, 50, fiber: 6),
    _entry(19, 'Cheddar cheese', 403, 25, 1.3, 33),
    _entry(
      20,
      'Ground beef, lean, cooked',
      250,
      26,
      0,
      15,
      preparation: _cooked,
    ),
    _entry(
      21,
      'Black beans, cooked',
      132,
      8.9,
      24,
      0.5,
      fiber: 8.7,
      preparation: _cooked,
    ),
    _entry(22, 'Orange juice', 45, 0.7, 10.4, 0.2, density: 1.04),
    _entry(23, 'Red wine', 85, 0.1, 2.6, 0, alcohol: 10.6, density: 0.99),
    _entry(
      24,
      'Protein bar, chocolate',
      380,
      33,
      35,
      12,
      brand: 'Test Brand',
      preparation: PreparationState.packaged,
      barcodeBody: '0000100000011',
      servings: const [CatalogServing(description: '1 bar', grams: 60)],
    ),
    _entry(
      25,
      'Cola',
      42,
      0,
      10.6,
      0,
      brand: 'Test Brand',
      density: 1.04,
      preparation: PreparationState.packaged,
      barcodeBody: '0000100000028',
    ),
    _entry(
      26,
      'Corn flakes cereal',
      375,
      8,
      80,
      2.5,
      brand: 'Test Brand',
      preparation: PreparationState.packaged,
      barcodeBody: '0000100000035',
    ),
    _entry(27, 'Pasta, dry', 371, 13, 75, 1.5, preparation: _raw, pair: 28),
    _entry(
      28,
      'Pasta, cooked',
      158,
      5.8,
      31,
      0.9,
      preparation: _cooked,
      pair: 27,
    ),
    _entry(29, 'Avocado', 160, 2, 8.5, 14.7, fiber: 6.7),
    _entry(30, 'Tofu, firm', 144, 17, 3, 9),
  ];
}
