import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

const _items = [
  FoodItem(
    id: '1',
    name: 'Greek yogurt, plain',
    brand: 'Fage',
    barcode: '00000000000011',
    servingLabel: '170 g',
    kcal: 100,
    proteinG: 18,
    carbsG: 6,
    fatG: 0,
  ),
  FoodItem(
    id: '2',
    name: 'Rolled oats',
    servingLabel: '40 g',
    kcal: 150,
    proteinG: 5,
    carbsG: 27,
    fatG: 3,
  ),
  FoodItem(
    id: '3',
    name: 'Oat milk',
    servingLabel: '240 ml',
    kcal: 120,
    proteinG: 3,
    carbsG: 16,
    fatG: 5,
  ),
];

/// What every [FoodSearch] must do. [create] builds one over exactly these
/// items (the contract supplies them, so any implementation that can be
/// seeded runs it).
void foodSearchContract(
  String name,
  FoodSearch Function(List<FoodItem> items) create,
) {
  group('$name as a FoodSearch', () {
    late FoodSearch search;
    setUp(() => search = create(_items));

    Future<List<String>> ids(String q, {int limit = 25}) async {
      final result = await search.search(q, limit: limit);
      return [
        for (final i in (result as Succeeded<List<FoodItem>>).value) i.id,
      ];
    }

    test('matches the name, ignoring case', () async {
      expect(await ids('YOGURT'), ['1']);
    });

    test('matches the brand', () async {
      expect(await ids('fage'), ['1']);
    });

    test('finds every item containing the text', () async {
      expect(await ids('oat'), unorderedEquals(['2', '3']));
    });

    test('no match is an empty success, not an error', () async {
      expect(await ids('pizza'), isEmpty);
    });

    test('an empty query finds nothing', () async {
      expect(await ids('  '), isEmpty);
    });

    test('honors the limit', () async {
      expect(await ids('oat', limit: 1), hasLength(1));
    });
  });
}
