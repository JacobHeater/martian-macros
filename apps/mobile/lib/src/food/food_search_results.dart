import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../food_packs/food_catalog_provider.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_list_row.dart';
import 'food_trust_mark.dart';

/// Foods from the installed packs that match [query], as the user types
/// (MM-42). Searching is on the phone and needs no network.
class FoodSearchResults extends ConsumerWidget {
  const FoodSearchResults({
    required this.query,
    required this.onPick,
    required this.onEnterManually,
    super.key,
  });

  final String query;
  final ValueChanged<CatalogFood> onPick;
  final VoidCallback onEnterManually;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalog = ref.watch(foodCatalogProvider).value;
    if (catalog == null) return const SizedBox.shrink();
    final hits = catalog.search(query, limit: 20);
    if (hits.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              catalog.packs.isEmpty
                  ? 'No food database is on this phone yet. You can download '
                        'one in Settings, or enter the food yourself.'
                  : 'Nothing found for "${query.trim()}".',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            MmButton(
              label: 'Enter manually',
              kind: MmButtonKind.secondary,
              onPressed: onEnterManually,
            ),
          ],
        ),
      );
    }
    return Column(
      children: [
        for (final hit in hits)
          MmListRow(
            key: ValueKey('food-hit-${hit.food.packId}-${hit.food.id}'),
            title: hit.food.brand == null
                ? hit.food.name
                : '${hit.food.name} · ${hit.food.brand}',
            detail: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${hit.food.kcal.round()} kcal per 100 g'),
                FoodTrustMark(food: hit.food),
              ],
            ),
            onTap: () => onPick(hit.food),
          ),
      ],
    );
  }
}
