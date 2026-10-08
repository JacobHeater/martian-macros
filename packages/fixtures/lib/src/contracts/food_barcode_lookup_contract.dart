import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

const _yogurt = FoodItem(
  id: '1',
  name: 'Greek yogurt, plain',
  barcode: '00000000000011',
  servingLabel: '170 g',
  kcal: 100,
  proteinG: 18,
  carbsG: 6,
  fatG: 0,
);

/// What every [FoodBarcodeLookup] must do. [create] builds one containing
/// exactly the given items.
void foodBarcodeLookupContract(
  String name,
  FoodBarcodeLookup Function(List<FoodItem> items) create,
) {
  group('$name as a FoodBarcodeLookup', () {
    late FoodBarcodeLookup lookup;
    setUp(() => lookup = create(const [_yogurt]));

    test('finds an item by its GTIN-14', () async {
      final result = await lookup.lookup('00000000000011');
      expect((result as Succeeded<FoodItem>).value.name, 'Greek yogurt, plain');
    });

    test('an unknown barcode is NotFound, not an error', () async {
      expect(await lookup.lookup('99999999999999'), isA<NotFound<FoodItem>>());
    });
  });
}
