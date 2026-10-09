import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'parsed_food_name.dart';

/// A generic food's preparation state and the food it pairs with (MM-151).
final class PreparationLink {
  const PreparationLink(this.state, [this.pairIndex]);

  final PreparationState state;

  /// Index, in the list given to [preparationLinks], of the paired food.
  final int? pairIndex;
}

/// Methods in the order a cooked entry is preferred as a raw food's pair:
/// the plain way people cook it and then weigh it.
const _preferred = ['boiled', 'steamed', 'roasted', 'baked', 'grilled'];

/// The preparation state of each name in [names], and for foods the source
/// states both raw (or dry) and cooked, the link between them (MM-151).
///
/// Names follow USDA's comma-separated style: "Rice, white, raw" and "Rice,
/// white, cooked". Two names pair when they are the same food once the state
/// and cooking words are set aside. A raw food points to its preferred cooked
/// entry and every cooked entry points to the raw one. Nothing is computed or
/// guessed: a food with only one state has no pair.
List<PreparationLink> preparationLinks(List<String> names) {
  final parsed = [for (final n in names) ParsedFoodName.of(n)];
  final groups = <String, List<int>>{};
  for (var i = 0; i < parsed.length; i++) {
    if (parsed[i].state == null) continue;
    groups.putIfAbsent(parsed[i].base, () => []).add(i);
  }
  final links = [
    for (final p in parsed)
      PreparationLink(p.state ?? PreparationState.unspecified),
  ];
  for (final members in groups.values) {
    final raws = [
      for (final i in members)
        if (parsed[i].state == PreparationState.raw) i,
    ];
    final cooked = [
      for (final i in members)
        if (parsed[i].state == PreparationState.cooked) i,
    ];
    if (raws.isEmpty || cooked.isEmpty) continue;
    final raw = _shortest(raws, names);
    final cook = _preferredCooked(cooked, parsed, names);
    links[raw] = PreparationLink(PreparationState.raw, cook);
    for (final c in cooked) {
      links[c] = PreparationLink(PreparationState.cooked, raw);
    }
    for (final r in raws) {
      if (r != raw) links[r] = PreparationLink(PreparationState.raw, cook);
    }
  }
  return links;
}

int _shortest(List<int> indexes, List<String> names) =>
    indexes.reduce((a, b) => names[b].length < names[a].length ? b : a);

int _preferredCooked(
  List<int> cooked,
  List<ParsedFoodName> parsed,
  List<String> names,
) {
  for (final method in _preferred) {
    final hits = [
      for (final i in cooked)
        if (parsed[i].methods.contains(method)) i,
    ];
    if (hits.isNotEmpty) return _shortest(hits, names);
  }
  return _shortest(cooked, names);
}
