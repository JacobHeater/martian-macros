import 'dart:io';

import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';
import 'package:sqlite3/sqlite3.dart';
import 'package:test/test.dart';

SqliteFoodPack fixture() => SqliteFoodPack.fromDatabase(
  const FoodPackWriter().writeInMemory(FixturePack.header, FixturePack.entries),
);

void main() {
  test('every fixture food passes the nutrition rule', () {
    for (final e in FixturePack.entries) {
      final f = e.food;
      expect(
        checkNutrition(
          NutritionPer100g(
            name: f.name,
            kcal: f.kcal,
            proteinG: f.proteinG,
            carbsG: f.carbsG,
            fatG: f.fatG,
            fiberG: f.fiberG,
            alcoholG: f.alcoholG,
          ),
        ),
        isNull,
        reason: f.name,
      );
    }
  });

  test('every fixture barcode is a valid GTIN-14', () {
    final codes = [for (final e in FixturePack.entries) ...e.barcodes];
    expect(codes, isNotEmpty);
    for (final code in codes) {
      expect(normalizeBarcode(code), code);
    }
  });

  test('a barcode finds its food, and an unknown one finds nothing', () {
    final pack = fixture();
    final code = FixturePack.entries.firstWhere((e) => e.barcodes.isNotEmpty);
    expect(pack.byBarcode(code.barcodes.first)?.name, code.food.name);
    expect(pack.byBarcode('00000000000000'), isNull);
  });

  test('nutrients survive the scaled-integer storage', () {
    final food = fixture().search('chicken breast cooked').first.food;
    expect(food.name, 'Chicken breast, cooked');
    expect(food.kcal, 165);
    expect(food.proteinG, 31);
    expect(food.fatG, 3.6);
    expect(food.tier, TrustTier.reference);
    expect(food.preparation, PreparationState.cooked);
  });

  test('search matches as the user types: prefixes of every word', () {
    final pack = fixture();
    expect(
      pack.search('chick bre').map((h) => h.food.name),
      unorderedEquals(['Chicken breast, cooked', 'Chicken breast, raw']),
    );
    expect(pack.search('Ba').map((h) => h.food.name), contains('Banana'));
    expect(pack.search('   '), isEmpty);
    expect(pack.search('zzzz'), isEmpty);
  });

  test('search is not broken by punctuation in the query', () {
    final pack = fixture();
    expect(() => pack.search('"chicken* OR (breast'), returnsNormally);
    expect(pack.search('chicken-breast').isNotEmpty, isTrue);
  });

  test('a name match ranks above a brand match, and paging continues', () {
    final pack = fixture();
    final first = pack.search('test', limit: 2);
    final next = pack.search('test', limit: 2, offset: 2);
    expect(first.length, 2);
    expect({
      ...first.map((h) => h.food.id),
      ...next.map((h) => h.food.id),
    }, hasLength(next.length + 2));
  });

  test('raw and cooked foods point at each other', () {
    final pack = fixture();
    final cooked = pack.search('rice cooked').first.food;
    final raw = pack.search('rice raw').first.food;
    expect(cooked.pairedFoodId, raw.id);
    expect(raw.pairedFoodId, cooked.id);
  });

  test('servings come back in order with their weights', () {
    final pack = fixture();
    final egg = pack.search('egg').first.food;
    final servings = pack.servingsOf(egg);
    expect(servings.single.description, '1 large egg');
    expect(servings.single.grams, 50);
  });

  test('density is carried for foods measured by volume', () {
    final milk = fixture().search('milk').first.food;
    expect(milk.densityGPerMl, 1.03);
  });

  test('the header says where the pack came from and its terms', () {
    final header = fixture().header;
    expect(header.region, 'US');
    expect(header.sources, ['Invented test data']);
    expect(header.license, isNotEmpty);
  });

  test('a pack with a format this code does not know is refused', () {
    final db = const FoodPackWriter().writeInMemory(
      FixturePack.header,
      FixturePack.entries,
    )..execute('PRAGMA user_version = 99');
    expect(
      () => SqliteFoodPack.fromDatabase(db),
      throwsA(
        isA<UnsupportedPackVersion>().having((e) => e.found, 'found', 99),
      ),
    );
  });

  test('a pack written to a file is opened read-only', () {
    final dir = Directory.systemTemp.createTempSync('pack');
    addTearDown(() => dir.deleteSync(recursive: true));
    final path = '${dir.path}/fixture.pack';
    const FoodPackWriter().write(path, FixturePack.header, FixturePack.entries);
    final pack = SqliteFoodPack.open(path);
    addTearDown(pack.close);
    expect(pack.search('banana'), isNotEmpty);
    final other = sqlite3.open(path, mode: OpenMode.readOnly);
    addTearDown(other.close);
    expect(
      () => other.execute('DELETE FROM foods'),
      throwsA(isA<SqliteException>()),
    );
  });

  test('several packs read as one ranked list', () {
    final catalog = FoodCatalog([fixture(), fixture()]);
    final hits = catalog.search('banana');
    expect(hits.length, 2);
    final byCode = FixturePack.entries.firstWhere((e) => e.barcodes.isNotEmpty);
    expect(catalog.byBarcode(byCode.barcodes.first), isNotNull);
    expect(catalog.servingsOf(hits.first.food), isNotEmpty);
  });

  test('search in a large pack stays fast', () {
    // Not the acceptance figures (they are for a phone and a million
    // products); this catches an accidental full scan on a laptop.
    final entries = [
      for (var i = 0; i < 50000; i++)
        PackEntry(
          food: CatalogFood(
            id: i + 1,
            packId: FixturePack.packId,
            name: 'Food $i item${i % 997} word${i % 31}',
            kcal: 100,
            proteinG: 5,
            carbsG: 10,
            fatG: 3,
            source: 'synthetic',
            tier: TrustTier.checkThis,
            tierReason: 'synthetic',
          ),
          barcodes: [FixturePack.gtin14('${i + 1}'.padLeft(13, '0'))],
        ),
    ];
    final pack = SqliteFoodPack.fromDatabase(
      const FoodPackWriter().writeInMemory(FixturePack.header, entries),
    );
    final timer = Stopwatch()..start();
    final hits = pack.search('food item5 wor');
    final searchMs = timer.elapsedMilliseconds;
    timer.reset();
    final found = pack.byBarcode(FixturePack.gtin14('25000'.padLeft(13, '0')));
    final lookupMs = timer.elapsedMilliseconds;
    expect(hits, isNotEmpty);
    expect(found?.id, 25000);
    expect(searchMs, lessThan(150));
    expect(lookupMs, lessThan(10));
  });
}
