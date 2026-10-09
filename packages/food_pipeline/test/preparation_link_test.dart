import 'package:mm_food_catalog/mm_food_catalog.dart';
import 'package:mm_food_pipeline/src/preparation_link.dart';
import 'package:test/test.dart';

/// MM-151: raw and cooked versions of one food are linked, using USDA's names.
void main() {
  test('rice raw and cooked pair both ways', () {
    final names = [
      'Rice, white, long-grain, regular, raw, enriched',
      'Rice, white, long-grain, regular, enriched, cooked',
      'Oats',
    ];
    final links = preparationLinks(names);
    expect(links[0].state, PreparationState.raw);
    expect(links[0].pairIndex, 1);
    expect(links[1].state, PreparationState.cooked);
    expect(links[1].pairIndex, 0);
    expect(links[2].state, PreparationState.unspecified);
    expect(links[2].pairIndex, isNull);
  });

  test('a food with one state has no pair and says which state it is', () {
    final links = preparationLinks(['Beef, ground, raw', 'Bread, white']);
    expect(links[0].state, PreparationState.raw);
    expect(links[0].pairIndex, isNull);
    expect(links[1].state, PreparationState.unspecified);
  });

  test('several cooked entries: the raw one points to the plain method', () {
    final names = [
      'Potatoes, russet, raw',
      'Potatoes, russet, baked',
      'Potatoes, russet, cooked, boiled',
      'Potatoes, russet, cooked, fried',
    ];
    final links = preparationLinks(names);
    // Only entries that say cooked or raw have a state.
    expect(links[0].pairIndex, 2, reason: 'boiled is preferred');
    expect(links[2].pairIndex, 0);
    expect(links[3].pairIndex, 0);
    expect(links[1].state, PreparationState.unspecified);
  });

  test('dry counts as the uncooked state', () {
    final links = preparationLinks([
      'Pasta, dry, enriched',
      'Pasta, cooked, enriched',
    ]);
    expect(links[0].state, PreparationState.raw);
    expect(links[0].pairIndex, 1);
    expect(links[1].pairIndex, 0);
  });

  test('different foods never pair', () {
    final links = preparationLinks(['Rice, white, raw', 'Rice, brown, cooked']);
    expect(links[0].pairIndex, isNull);
    expect(links[1].pairIndex, isNull);
  });
}
