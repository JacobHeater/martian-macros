import 'dart:io';

import 'package:mm_food_catalog/mm_food_catalog.dart';
import 'package:mm_food_pipeline/mm_food_pipeline.dart';
import 'package:test/test.dart';

// Valid GTIN-14s (check digit verified in mm_domain's barcode tests).
const _gtinA = '00042100005264';
final _gtinB = FixturePack.gtin14('0000100000011');

CandidateFood product(
  String source,
  String id, {
  String? barcode = '042100005264',
  String name = 'Soup',
  double? kcal = 100,
  double? protein = 5,
  double? carbs = 10,
  double? fat = 4.4,
  int version = 0,
  List<CatalogServing> servings = const [],
  int updatedAt = 0,
}) => CandidateFood(
  source: source,
  sourceId: id,
  kind: FoodKind.barcode,
  name: name,
  rawBarcode: barcode,
  kcal: kcal,
  proteinG: protein,
  carbsG: carbs,
  fatG: fat,
  versionKey: version,
  servings: servings,
  updatedAt: updatedAt,
);

CandidateFood generic(String id, String name) => CandidateFood(
  source: 'usda_foundation',
  sourceId: id,
  kind: FoodKind.generic,
  name: name,
  kcal: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
);

const policy = PreferredSourcePolicy('off');

Future<PackBuildResult> build(List<CandidateFood> foods) =>
    const PackBuilder(policy: policy).build(Stream.fromIterable(foods));

void main() {
  group('most recent policy', () {
    const recent = PackBuilder(policy: MostRecentPolicy(tieBreak: 'off'));

    test(
      'the fresher of two consistent records wins, from either source',
      () async {
        for (final usdaNewer in [false, true]) {
          final result = await recent.build(
            Stream.fromIterable([
              product('usda_branded', 'u', updatedAt: usdaNewer ? 200 : 100),
              product('off', 'o', updatedAt: usdaNewer ? 100 : 200),
            ]),
          );
          expect(
            result.barcode.single.food.source,
            usdaNewer ? 'usda_branded' : 'off',
          );
          expect(
            result.report.dropped.values.single[DropReason.lostConflict],
            1,
          );
        }
      },
    );

    test('equally recent records go to the tie-break source', () async {
      final result = await recent.build(
        Stream.fromIterable([
          product('usda_branded', 'u', updatedAt: 5),
          product('off', 'o', updatedAt: 5),
        ]),
      );
      expect(result.barcode.single.food.source, 'off');
    });

    test('a fresher record that fails the checks still loses', () async {
      final result = await recent.build(
        Stream.fromIterable([
          product('usda_branded', 'u', updatedAt: 1),
          product(
            'off',
            'o',
            updatedAt: 9,
            kcal: 900,
            protein: 1,
            carbs: 1,
            fat: 1,
          ),
        ]),
      );
      expect(result.barcode.single.food.source, 'usda_branded');
    });

    test('a 10% disagreement is still marked check this', () async {
      final result = await recent.build(
        Stream.fromIterable([
          product('usda_branded', 'u', updatedAt: 1),
          product('off', 'o', updatedAt: 9, kcal: 130, fat: 8),
        ]),
      );
      expect(result.barcode.single.food.tierReason, contains('disagree'));
    });
  });

  test(
    'entries failing the nutrition checks are dropped with a reason',
    () async {
      final result = await build([
        product('off', '1', kcal: 690, barcode: _gtinA),
        product('off', '2', carbs: null, barcode: _gtinB),
        product('usda_branded', '3', name: ' '),
      ]);
      final dropped = result.report.dropped;
      expect(dropped['off']![DropReason.energyDisagreesWithMacros], 1);
      expect(dropped['off']![DropReason.missingValue], 1);
      expect(dropped['usda_branded']![DropReason.missingName], 1);
      expect(result.barcode, isEmpty);
    },
  );

  test(
    'a missing or invalid barcode drops a product, not a generic food',
    () async {
      final result = await build([
        product('off', '1', barcode: null),
        product('off', '2', barcode: '042100005265'), // bad check digit
        generic('9', 'Chicken breast, cooked'),
      ]);
      expect(result.report.dropped['off']![DropReason.invalidBarcode], 2);
      expect(result.generic.single.food.name, 'Chicken breast, cooked');
      expect(result.generic.single.barcodes, isEmpty);
    },
  );

  test('every form of a barcode meets the same product', () async {
    final result = await build([
      product('usda_branded', '1', barcode: '042100005264', version: 1),
      product('off', '2', barcode: '0042100005264'),
    ]);
    expect(result.barcode, hasLength(1));
    expect(result.barcode.single.barcodes, [_gtinA]);
  });

  test('the newest version within a source wins, whatever the order', () async {
    for (final order in [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ]) {
      final result = await build([
        for (final v in order)
          product('usda_branded', 'id$v', version: v, name: 'Soup v$v'),
      ]);
      expect(result.barcode.single.food.sourceId, 'id3', reason: '$order');
      expect(
        result.report.dropped['usda_branded']![DropReason.supersededVersion],
        2,
      );
    }
  });

  test(
    'the preferred source wins a shared barcode, and the loser is counted',
    () async {
      final result = await build([
        product('usda_branded', 'u', name: 'USDA soup'),
        product('off', 'o', name: 'OFF soup'),
      ]);
      expect(result.barcode.single.food.source, 'off');
      expect(
        result.report.dropped['usda_branded']![DropReason.lostConflict],
        1,
      );
    },
  );

  test('records that differ by more than 10% are marked check this', () async {
    final far = await build([
      product('usda_branded', 'u', kcal: 100),
      product('off', 'o', kcal: 130, fat: 8),
    ]);
    expect(far.barcode.single.food.tier, TrustTier.checkThis);
    expect(far.barcode.single.food.tierReason, contains('disagree'));

    final near = await build([
      product('usda_branded', 'u', kcal: 100),
      product('off', 'o', kcal: 102),
    ]);
    expect(
      near.barcode.single.food.tier,
      TrustTier.checkThis,
      reason: 'Open Food Facts data is check-this on its own',
    );
    expect(near.barcode.single.food.tierReason, isNot(contains('disagree')));
  });

  test('a record that fails the checks never beats one that passes', () async {
    final result = await build([
      product('usda_branded', 'u'),
      product('off', 'o', kcal: 900, protein: 1, carbs: 1, fat: 1),
    ]);
    expect(result.barcode.single.food.source, 'usda_branded');
  });

  test(
    'every food written says which source and which id it came from',
    () async {
      final result = await build([
        product('usda_branded', '77', barcode: _gtinB),
        generic('12', 'Rice, cooked'),
      ]);
      for (final entry in [...result.barcode, ...result.generic]) {
        expect(entry.food.source, isNotEmpty);
        expect(entry.food.sourceId, isNotEmpty);
      }
      expect(result.barcode.single.food.sourceId, '77');
    },
  );

  test('servings are carried through', () async {
    final result = await build([
      product(
        'usda_branded',
        '1',
        servings: const [CatalogServing(description: '1 cup', grams: 240)],
      ),
    ]);
    expect(result.barcode.single.servings.single.grams, 240);
  });

  test('read equals written plus dropped, and the report says so', () async {
    final result = await build([
      product('off', '1'),
      product('off', '2', kcal: 690, barcode: _gtinB),
      product('usda_branded', '3', version: 1),
      product('usda_branded', '4'),
      generic('5', 'Egg'),
      generic('6', ' '),
    ]);
    final report = result.report;
    expect(report.totalRead, 6);
    expect(report.reconciles, isTrue);
    expect(report.totalWritten + report.totalDropped, 6);
    expect(report.format(), isNot(contains('DOES NOT RECONCILE')));
  });

  test('the same candidates in any order build the same packs', () async {
    final foods = [
      for (var i = 0; i < 20; i++)
        product(
          i.isEven ? 'off' : 'usda_branded',
          'id$i',
          barcode: i < 10 ? '042100005264' : '000001000000$i'.substring(0, 12),
          name: 'Soup $i',
          version: i,
        ),
      generic('g1', 'Zucchini'),
      generic('g2', 'Apple'),
    ];
    final a = await build(foods);
    final b = await build(foods.reversed.toList());
    expect(
      [for (final e in a.barcode) e.food.sourceId],
      [for (final e in b.barcode) e.food.sourceId],
    );
    expect([for (final e in a.generic) e.food.name], ['Apple', 'Zucchini']);
    expect([for (final e in b.generic) e.food.name], ['Apple', 'Zucchini']);
  });

  test('written packs are byte-identical across runs and readable', () async {
    final dir = Directory.systemTemp.createTempSync('packs');
    addTearDown(() => dir.deleteSync(recursive: true));
    final provenance = BuildProvenance(
      builtOn: '2026-10-09',
      sources: const ['test source 1'],
    );
    Future<List<List<int>>> run(String name) async {
      final out = Directory('${dir.path}/$name');
      writePacks(
        await build([
          product('off', '1'),
          product('usda_branded', '2', barcode: _gtinB),
          generic('3', 'Chicken breast, cooked'),
        ]),
        provenance,
        out,
      );
      return [
        File('${out.path}/generic.pack').readAsBytesSync(),
        File('${out.path}/barcode_us.pack').readAsBytesSync(),
      ];
    }

    final first = await run('one');
    final second = await run('two');
    expect(first[0], second[0]);
    expect(first[1], second[1]);

    final pack = SqliteFoodPack.open('${dir.path}/one/barcode_us.pack');
    addTearDown(pack.close);
    expect(pack.header.sources, ['test source 1']);
    expect(pack.header.builtOn, '2026-10-09');
    expect(pack.byBarcode(_gtinA)?.sourceId, '1');
  });

  test('candidates read from CSV rows keep missing values missing', () {
    const header = [
      'source',
      'source_id',
      'kind',
      'name',
      'brand',
      'gtin',
      'kcal',
      'protein',
      'carbs',
      'fat',
      'fiber',
      'sodium_mg',
      'alcohol',
      'servings',
      'version_key',
    ];
    final food = candidateFromRow(header, [
      'usda_branded',
      '5',
      'barcode',
      'Soup',
      '',
      '042100005264',
      '100',
      '5',
      '',
      '4',
      '',
      '',
      '',
      '[{"d":"1 cup","g":240.0},{"d":"bad","g":0}]',
      '9',
    ]);
    expect(food.carbsG, isNull);
    expect(food.brand, isNull);
    expect(food.versionKey, 9);
    expect(food.servings.map((s) => s.description), ['1 cup']);
  });
}
